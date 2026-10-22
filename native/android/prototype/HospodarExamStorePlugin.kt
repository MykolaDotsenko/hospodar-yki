package fi.hospodar.yki.bridge

import androidx.room.Room
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Integration prototype; must be copied into a generated Capacitor Android app
 * and compiled/device-tested before claiming Android support.
 *
 * JS contract:
 *    readAttempt({key:"current"})
 *    commitAttempt({protocol:1,key:"current",eventId,expectedRevision,kind,session})
 *    deleteAttempt({key:"current"})
 */
@CapacitorPlugin(name = "HospodarExamStore")
class HospodarExamStorePlugin : Plugin() {
    private val io = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val database by lazy {
        Room.databaseBuilder(context, ExamDatabase::class.java, "hospodar-yki-exams.db").build()
    }

    @PluginMethod
    fun readAttempt(call: PluginCall) {
        if (call.getString("key") != "current") {
            call.reject("INVALID_KEY"); return
        }
        io.launch {
            try {
                val row = database.examDao().read("current")
                val result = JSObject()
                if (row != null) {
                    result.put("key", row.key)
                    result.put("revision", row.revision)
                    result.put("session", JSONObject(row.sessionJson))
                }
                activity.runOnUiThread { call.resolve(result) }
            } catch (error: Exception) { reject(call,error) }
        }
    }

    @PluginMethod
    fun commitAttempt(call: PluginCall) {
        val session = call.getObject("session")
        val revision = call.getInt("expectedRevision")
        val eventId = call.getString("eventId")
        val kind = call.getString("kind")
        if (call.getInt("protocol") != 1 || call.getString("key") != "current" ||
            session == null || revision == null || eventId == null || kind == null) {
            call.reject("INVALID_COMMAND"); return
        }
        io.launch {
            try {
                val committed = database.examDao().commitAttempt(
                    NativeCommitCommand("current",eventId,revision.toLong(),kind,session.toString())
                )
                val result = JSObject()
                result.put("applied",committed.applied)
                result.put("revision",committed.revision)
                result.put("session",JSONObject(committed.sessionJson))
                activity.runOnUiThread { call.resolve(result) }
            } catch (error: Exception) { reject(call,error) }
        }
    }

    @PluginMethod
    fun deleteAttempt(call: PluginCall) {
        if (call.getString("key") != "current") {
            call.reject("INVALID_KEY"); return
        }
        io.launch {
            try {
                database.examDao().deleteAll()
                activity.runOnUiThread { call.resolve() }
            } catch (error: Exception) { reject(call,error) }
        }
    }

    private fun reject(call: PluginCall, error: Exception) {
        val code = if (error is ExamRevisionConflict) "REVISION_CONFLICT" else "SAVE_FAILED"
        activity.runOnUiThread { call.reject(code,code,error) }
    }
}

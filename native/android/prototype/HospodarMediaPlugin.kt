package fi.hospodar.yki.bridge

import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

/**
 * Install-time PAD only. Access assets with AssetManager, not a guessed filesystem
 * location. Media3 supports asset:/// paths via its DefaultDataSource.
 *
 * PROTOTYPE LIMIT: Video surface + real AAB/Play device tests NOT implemented.
 * For full video add a native PlayerView/SurfaceView lifecycle integration.
 */
@CapacitorPlugin(name = "HospodarMedia")
class HospodarMediaPlugin : Plugin() {
    private val io = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val assetByHandle = ConcurrentHashMap<String, String>()
    private var player: ExoPlayer? = null

    private fun validPath(path: String): Boolean =
        path.length in 1..399 && !path.startsWith("/") &&
        !path.contains('\\') && !path.contains(':') &&
        !path.contains('?') && !path.contains('#') &&
        path.split("/").all { it.isNotEmpty() && it != "." && it != ".." }

    @PluginMethod
    fun prepareAsset(call: PluginCall) {
        val mediaId=call.getString("mediaId")
        val path=call.getString("relativePath")
        val hash=call.getString("expectedSha256")
        val pack=call.getString("packId")
        if (mediaId.isNullOrBlank() || path==null || !validPath(path) ||
            pack.isNullOrBlank() || hash == null || !hash.matches(Regex("[a-f0-9]{64}"))) {
            call.reject("BAD_ASSET");return
        }
        io.launch {
            try {
                val digest=MessageDigest.getInstance("SHA-256")
                // Bounded memory: at most 64 KiB while validating a multi-GB pack.
                context.assets.open(path).use {stream ->
                    val buffer=ByteArray(64*1024)
                    while(true){
                        val n=stream.read(buffer)
                        if(n<0)break
                        digest.update(buffer,0,n)
                    }
                }
                val actual=digest.digest().joinToString(""){"%02x".format(it)}
                if(actual!=hash)throw IllegalStateException("HASH_MISMATCH")
                // Seekable sample media must be stored uncompressed inside APK.
                // openFd throws for compressed assets; fail closed before playback.
                context.assets.openFd(path).use {descriptor ->
                    check(descriptor.length>0L) {"NON_SEEKABLE_ASSET"}
                }
                // We never expose a raw file:// URI or filesystem path to JS.
                val handle=java.util.UUID.randomUUID().toString()
                assetByHandle[handle]=path
                val result=JSObject()
                result.put("ready",true)
                result.put("handle",handle)
                result.put("verifiedSha256",actual)
                activity.runOnUiThread{call.resolve(result)}
            }catch(error:Exception){
                activity.runOnUiThread{call.reject(error.message ?: "ASSET_UNAVAILABLE")}
            }
        }
    }

    @PluginMethod
    fun playAsset(call: PluginCall) {
        val path=assetByHandle[call.getString("handle")] ?: run {
            call.reject("NOT_RESOLVED");return
        }
        activity.runOnUiThread {
            try {
                if(player==null)player=ExoPlayer.Builder(context).build()
                val uri=Uri.parse("asset:///" + path)
                player!!.setMediaItem(MediaItem.fromUri(uri))
                player!!.prepare()
                player!!.play()
                call.resolve()
            }catch(error:Exception){call.reject(error.message ?: "PLAY_FAILED")}
        }
    }

    @PluginMethod
    fun seekAsset(call: PluginCall) {
        val handle=call.getString("handle")
        val position=call.getInt("positionMs")
        if(!assetByHandle.containsKey(handle) || position==null || position<0){
            call.reject("BAD_SEEK");return
        }
        activity.runOnUiThread {
            try{player?.seekTo(position.toLong());call.resolve()}
            catch(error:Exception){call.reject(error.message ?: "SEEK_FAILED")}
        }
    }

    @PluginMethod
    fun stopAsset(call: PluginCall) {
        val handle=call.getString("handle")
        if(handle!=null)assetByHandle.remove(handle)
        activity.runOnUiThread{player?.stop();call.resolve()}
    }

    override fun handleOnDestroy(){
        player?.release();player=null
        assetByHandle.clear()
        super.handleOnDestroy()
    }
}

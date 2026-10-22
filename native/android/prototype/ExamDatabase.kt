package fi.hospodar.yki.bridge

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Transaction

/** Portable protocol matches app/attempt-storage.d.ts. Do not store audio or secrets here. */
@Entity(tableName = "exam_sessions")
data class ExamSessionRow(
    @PrimaryKey val key: String,
    val revision: Long,
    val sessionJson: String
)

@Entity(tableName = "exam_events")
data class ExamEventRow(
    @PrimaryKey val eventId: String,
    val kind: String,
    val revision: Long
)

data class NativeCommitCommand(
    val key: String,
    val eventId: String,
    val expectedRevision: Long,
    val kind: String,
    val sessionJson: String
)

data class NativeCommitResult(
    val applied: Boolean,
    val revision: Long,
    val sessionJson: String
)

class ExamRevisionConflict : IllegalStateException("REVISION_CONFLICT")

@Dao
abstract class ExamDao {
    @Query("SELECT * FROM exam_sessions WHERE `key` = :key LIMIT 1")
    abstract suspend fun read(key: String): ExamSessionRow?

    @Query("SELECT * FROM exam_events WHERE eventId = :eventId LIMIT 1")
    abstract suspend fun getEvent(eventId: String): ExamEventRow?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun replaceSession(session: ExamSessionRow)

    @Insert(onConflict = OnConflictStrategy.ABORT)
    abstract suspend fun addEvent(event: ExamEventRow)

    @Query("DELETE FROM exam_sessions")
    abstract suspend fun clearSessions()

    @Query("DELETE FROM exam_events")
    abstract suspend fun clearEvents()

    /** One Room transaction: no JS callback crosses this boundary mid-write. */
    @Transaction
    open suspend fun commitAttempt(cmd: NativeCommitCommand): NativeCommitResult {
        require(cmd.key == "current" && cmd.expectedRevision >= 0)
        require(cmd.kind in setOf("start", "answer", "navigate", "finish", "legacy-import"))
        require(cmd.eventId.matches(Regex("[A-Za-z0-9_-]{8,128}")))
        require(cmd.sessionJson.length <= 250_000)
        val previous = read(cmd.key)
        if (getEvent(cmd.eventId) != null) {
            check(previous != null) { "Committed event without a session" }
            return NativeCommitResult(false, previous.revision, previous.sessionJson)
        }
        val revision = previous?.revision ?: 0L
        if (revision != cmd.expectedRevision) throw ExamRevisionConflict()
        val next = ExamSessionRow(cmd.key, revision + 1, cmd.sessionJson)
        replaceSession(next)
        addEvent(ExamEventRow(cmd.eventId, cmd.kind, next.revision))
        return NativeCommitResult(true, next.revision, next.sessionJson)
    }

    @Transaction
    open suspend fun deleteAll() {
        clearSessions()
        clearEvents()
    }
}

@Database(entities = [ExamSessionRow::class, ExamEventRow::class], version = 1, exportSchema = true)
abstract class ExamDatabase : RoomDatabase() {
    abstract fun examDao(): ExamDao
}

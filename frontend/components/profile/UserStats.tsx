export function UserStats({
    stats,
}: {
    stats: { learnedCount: number; streak: number; totalSessions: number };
}) {
    return (
        <div className="space-y-2">
            <p>Learned Words: {stats.learnedCount}</p>
            <p>Streak: {stats.streak}</p>
            <p>Total Sessions: {stats.totalSessions}</p>
        </div>
    );
}

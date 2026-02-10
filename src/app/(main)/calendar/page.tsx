
import { CalendarView } from '@/features/calendar/components/CalendarView'

export default function CalendarPage() {
    return (
        <div className="h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col">
            <CalendarView />
        </div>
    )
}

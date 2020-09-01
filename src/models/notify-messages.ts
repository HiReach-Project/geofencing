export interface NotifyMessages {
    [key: string]: {
        notifyOutOfFence: string
        notifyReachedCustomArea: string
        notifyNoArrival: string
        notifyLateArrival: string
        notifyEarlyArrival: string
        notifyReachedDestination: string
        notifyFenceStarted: string
    }
}

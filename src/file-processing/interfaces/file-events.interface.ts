interface FileStatusEvent {
    uuid: string;
    url: string;
    status: 'success' | 'failed';
    error: string | null;
    progress: number;
}

interface FileProgressEvent {
    uuid: string;
    progress: number;
    phase: string;
}

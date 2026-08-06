declare namespace chrome {
  namespace runtime {
    const id: string | undefined;
    const lastError: { message?: string } | undefined;
    function sendMessage(message: unknown, callback?: () => void): void;
  }
}

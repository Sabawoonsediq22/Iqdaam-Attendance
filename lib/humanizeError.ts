export function humanizeError(err: unknown): string {
  if (typeof err === "string") return "Something went wrong.";
  if (err instanceof Error) {
    if (err.message.includes("Failed to fetch")) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    if (err.message.toLowerCase().includes("delete")) {
      return "We couldn't delete this class. Please try again.";
    }
    if (err.message.toLowerCase().includes("update")) {
      return "Updating the class failed. Try again.";
    }
    if (err.message.toLowerCase().includes("create")) {
      return "Creating the class failed. Try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}
export async function register() {
  // Only start the worker in the actual Node.js server runtime, never
  // during Edge middleware or the build step.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getBoss } = await import("@/lib/job-queue");
    await getBoss();
    console.log("[instrumentation] pg-boss worker started");
  }
}

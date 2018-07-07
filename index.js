/**
 * Creates a class exposing an update function that will batch all
 * the updates in the current frame of execution and run the updateFn once,
 * the batching is done by a batchingFn that defaults to a sum
 */
class UpdateBatcher {
  constructor(_updateFn, _batchingFunction) {
    this.updateFn = _updateFn;
    this.batchingFunction = _batchingFunction || ((a, b) => a + b);
    this.queue = [];
  }

  /**
   * Enqueues an update and returns a promise that will resolve to
   * the value returned by the updateFn
   */
  update(updateValue) {
    return new Promise((resolve, reject) => {
      this.queue.push({ updateValue, resolve });

      // schedule an update in the next execution tick
      if (this.queue.length === 1) {
        enqueuePostPromiseJob(() => dispatchQueue(this));
      }
    });
  }
}

// Private: Enqueue a Job to be executed after all "PromiseJobs" Jobs.
//
// ES6 JavaScript uses the concepts Job and JobQueue to schedule work to occur
// after the current execution context has completed:
// http://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues
//
// Node.js uses the `process.nextTick` mechanism to implement the concept of a
// Job, maintaining a global FIFO JobQueue for all Jobs, which is flushed after
// the current call stack ends.
//
// When calling `then` on a Promise, it enqueues a Job on a specific
// "PromiseJobs" JobQueue which is flushed in Node as a single Job on the
// global JobQueue.
//
// DataLoader batches all loads which occur in a single frame of execution, but
// should include in the batch all loads which occur during the flushing of the
// "PromiseJobs" JobQueue after that same execution frame.
//
// In order to avoid the DataLoader dispatch Job occuring before "PromiseJobs",
// A Promise Job is created with the sole purpose of enqueuing a global Job,
// ensuring that it always occurs after "PromiseJobs" ends.
//
// Node.js's job queue is unique. Browsers do not have an equivalent mechanism
// for enqueuing a job to be performed after promise microtasks and before the
// next macrotask. For browser environments, a macrotask is used (via
// setImmediate or setTimeout) at a potential performance penalty.
const enqueuePostPromiseJob =
  typeof process === "object" && typeof process.nextTick === "function"
    ? function(fn) {
        if (!resolvedPromise) {
          resolvedPromise = Promise.resolve();
        }
        resolvedPromise.then(() => process.nextTick(fn));
      }
    : setImmediate || setTimeout;

// Private: cached resolved Promise instance
let resolvedPromise;

// Perform a batch update and resolve all promises in the queue with the returned value
const dispatchQueue = async loader => {
  const { batchingFunction, updateFn } = loader;
  const _queue = loader.queue;
  loader.queue = [];

  const updateValue = _queue.map(el => el.updateValue).reduce(batchingFunction);
  const result = updateFn(updateValue);

  if (typeof result === "object" && result.then) {
    result.then(resolveValue =>
      _queue.forEach(el => {
        el.resolve(resolveValue);
      })
    );
  } else {
    _queue.forEach(el => {
      el.resolve(result);
    });
  }
};

module.exports = UpdateBatcher;

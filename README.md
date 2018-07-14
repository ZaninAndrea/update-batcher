# Update Batcher
Update Batcher batches all the calls to an update function to reduce calls to the database.

## How to use
Install the library
```bash
npm install --save update-batcher
```
or
```bash
yarn add update-batcher
```

Import the module
```js
const UpdateBatcher = require("update-batcher");
```

Create an instance passing an update function and optionally a batching function
```js
const database = { a: 1 };

const updater = new UpdateBatcher(x => {
  database.a = x;
});

// or with a custom batching function
const multiplicativeUpdater = new UpdateBatcher(x => {
  database.a = x;
}, (a, b) => a * b);
```

Run updates
```js
// the update function will be called only once
updater.update(1)
updater.update(3)
updater.update(2)
```
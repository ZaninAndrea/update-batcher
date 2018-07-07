const UpdateBatcher = require("./index");

const testUpdate = new UpdateBatcher(x => x);

(async () => {
  testUpdate.update(3);
  testUpdate.update(3);
  const total = await testUpdate.update(3);

  console.log(total);
})();

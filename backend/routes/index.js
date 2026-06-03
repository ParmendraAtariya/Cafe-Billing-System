const {
  categoryRouter, billRouter, inventoryRouter, customerRouter,
  couponRouter, tableRouter, supplierRouter, notificationRouter,
  userRouter, uploadRouter,
} = require('./otherRoutes');

module.exports = {
  categoryRoutes: categoryRouter,
  billRoutes: billRouter,
  inventoryRoutes: inventoryRouter,
  customerRoutes: customerRouter,
  couponRoutes: couponRouter,
  tableRoutes: tableRouter,
  supplierRoutes: supplierRouter,
  notificationRoutes: notificationRouter,
  userRoutes: userRouter,
  uploadRoutes: uploadRouter,
};

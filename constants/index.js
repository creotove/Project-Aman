export const pipeline = [
    {
      $lookup: {
        from: "users", // Assuming "users" is the collection name for users
        localField: "user_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer", // If there is a one-to-one relationship, otherwise use $unwind only if needed
    },
    {
      $project: {
        customer_id: 1,
        name: "$customer.name",
        phoneNumber: "$customer.phoneNumber",
        avatar: "$customer.avatar",
      },
    },
  ];
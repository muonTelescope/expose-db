// The model definition is done here
// As you might notice, the DataTypes are the very same as explained above
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("detector", {
    name: {
      type : DataTypes.STRING(),
      allowNull : false
    },
    description: DataTypes.TEXT(),
    alias: {
      type : DataTypes.STRING(),
      allowNull : false,
      unique: true,
      validate : {
        isAlphanumeric: true,
        isLowercase: true
      }
    },
    apiKey : {
      type : DataTypes.STRING(),
      allowNull : false,
      unique : true
    },
    tags: DataTypes.STRING(),
    fields: {
      type : DataTypes.TEXT(),
      allowNull : false
    },
    location: DataTypes.STRING(),
    public: {
      type : DataTypes.BOOLEAN(),
      allowNull : false
    }
  })
}
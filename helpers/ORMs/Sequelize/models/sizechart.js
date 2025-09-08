"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SizeChart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed
    }
  }

  SizeChart.init(
    {
      store_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      chart_data: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('chart_data');
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue('chart_data', JSON.stringify(value));
        }
      },
      unit: {
        type: DataTypes.STRING,
        defaultValue: 'cm',
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: "SizeChart",
      tableName: "size_charts",
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'product_id']
        }
      ]
    }
  );
  
  return SizeChart;
};
/*module.exports = (sequelize, Sequelize) => {
    const Purchase = sequelize.define("purchase", {
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        }
      },
      orderDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  
    return Purchase;
  };*/
  
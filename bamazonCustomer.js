const inquirer = require("inquirer");
const mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "root",
  database: "bamazon"
});


const displayAll = function() {
  return new Promise((resolve, reject) => {
    console.log("inside promise");
    var returnVal = [];
    var query = "SELECT * FROM products"; 
    connection.query(query, function (err, res) {
      if (err) throw err;
      for (var i = 0; i < res.length; i++) {
        returnVal.push(`Product ID: ${res[i].item_id} // ` +
                    `Product Name: ${res[i].product_name} // ` +
                    `Product Price: ${res[i].price}`
                    );
      }
      resolve(returnVal);
    });
  })
}

const continueShopping = function() {
  inquirer
    .prompt({
      name: "anotherPurchase",
      type: "input",
      message: "Would you like to continue shopping?(Y/N)"
      // validate later
    }).then(function(response) {
      if (response.anotherPurchase.toLowerCase() === "y") {
        logic();
      } else {
        console.log("Thanks for shopping, bye!");
        connection.end();
      }
    })
}

const checkStock = function(id, numUnits) {
  connection.query("SELECT * FROM products WHERE item_id = ?", [id], function(err, res) {
    // console.log(res);
    // console.log(res[0].stock_quantity);
    if (res[0].stock_quantity < numUnits) {
      console.log("Insufficient stock to procure your order.");
      continueShopping();
    } else {
      console.log("Yes, enough stock");
      let remainingUnits = res[0].stock_quantity - numUnits;
      console.log(remainingUnits);
        connection.query("UPDATE products SET ? WHERE ?",
        [
          {
            stock_quantity: remainingUnits
          },
          {
            item_id: id
          }
        ], 
        function(err) {
          if (err) throw err;
          console.log("Successful purchase!");
          continueShopping();
        }
        )
    }
  })
}

const promptCustomer = function() {
  console.log("did we get here?")
  inquirer
    .prompt({
      name: "idRequest",
      type: "input",
      message: "What Product ID would you like to buy?"
      // validate later
    }).then(function(product) {
      inquirer.prompt({
        name: "numberUnits",
        type: "input",
        message: "How many units would you like to buy?"
        // validate later
      }).then(function(amount) {

        checkStock(product.idRequest, amount.numberUnits);

      })
    })
}



// *********************************

const start = function() {
  console.log("Hooray!  Connected");
};


async function logic(err) {
  if (err) throw err;
  start();

  const message = await displayAll();
  for (let i = 0; i < message.length; i++) {
    console.log(message[i]);
  }

  promptCustomer();

}


connection.connect(logic);
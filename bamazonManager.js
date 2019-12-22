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

//Prints all items in array
const myPrint = function(arr) {
  arr.forEach(element => {
    console.log(element);
  });
}

//Breaks up console messages for user's understanding
const lineBreak = function() {
  console.log("\n***************************\n")
}

//Handles "View Products for Sale"
const viewProducts = function() {
  return new Promise ((resolve, reject) => {
    let returnArr = [];
    let query = "SELECT * FROM products";
    connection.query(query, function(err, res) {
      if (err) throw err;
      for (var i = 0; i < res.length; i++) {
        returnArr.push(`Product ID: ${res[i].item_id} // ` +
                    `Product Name: ${res[i].product_name} // ` +
                    `Product Price: ${res[i].price} // ` +
                    `Stock Quantity: ${res[i].stock_quantity}`
                    );
      }
      resolve(returnArr);
    })
  })
}

//Handles "View Low Inventory"
const lowInventory = function() {
  return new Promise ((resolve, reject) => {
    let returnArr = [];
    let query = "SELECT * FROM products WHERE stock_quantity < 30";
    connection.query(query, function(err, res) {
      if (err) throw err;
      for (var i = 0; i < res.length; i++) {
        returnArr.push(`Product ID: ${res[i].item_id} // ` +
                    `Product Name: ${res[i].product_name} // ` +
                    `Product Price: ${res[i].price} // ` +
                    `Stock Quantity: ${res[i].stock_quantity}`
                    );
      }
      resolve(returnArr)
    })
  })
}

//Used by "Add to Inventory" to give user options 
  //of what product to add inventory to
const addInventoryChoices = function() {
  return new Promise ((resolve, reject) => {
    let returnArr = [];
    let query = "SELECT * FROM products";
    connection.query(query, function(err, res) {
      if (err) throw err;
      for (var i = 0; i < res.length; i++) {
        returnArr.push(res[i].product_name)
      }
      resolve(returnArr);
    })
  })
}

//Used by "Add to Inventory" to determine the previous stock amount
const oldStock = function(whichProduct) {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM products WHERE product_name = ?",whichProduct,function(err, res) {
      if (err) throw err;
      resolve(res[0].stock_quantity);
    });
  })
}

//Handles "Add to Inventory"
const addInventory = async function() {
  return new Promise(async function (resolve, reject) {
    let choices = await addInventoryChoices();
    inquirer
      .prompt([
        {
          name: "whichProduct",
          type: "list",
          message: "Which product would you like to add inventory to?",
          choices: choices
        },
        {
          name: "howMany",
          type: "number",
          message: `How many would you like to add?`,
          validate: function(value) {
            if (isNaN(value) === false) {
              return true;
            }
            return `Please select a number`;
          }
        }
      ])
      .then(async function(answer) {
        let oldStockNumber = await oldStock(answer.whichProduct);
        var newStock = oldStockNumber + answer.howMany
        connection.query("UPDATE products SET ? WHERE ?",
          [
            {
              stock_quantity: newStock
            },
            {
              product_name: answer.whichProduct
            }
          ],
          function(err, res) {
            if (err) throw err;
            resolve(`Successfully Added! ${answer.whichProduct} now has ${newStock} remaining`)
          }
        )
      })  
  })
}

//Handles "Add New Product"
const addNewProduct = function() {
  return new Promise(async function(resolve, reject) {
    inquirer
      .prompt([
        {
          name: "item",
          type: "input",
          message: "What is the product you would like to add?",
          validate: function(value) {
            if (value.length <= 100) {
              return true;
            }
            return 'Please use 100 characters or less'
          }
        },
        {
          name: "department",
          type: "input",
          message: "What department does it belong to?",
          validate: function(value) {
            if (value.length <= 100) {
              return true;
            }
            return 'Please use 100 characters or less'
          }
        },
        {
          name: "price",
          type: "number",
          message: "What is the price of the product?",
          validate: function(value) {
            if (isNaN(value) === false && value === Math.ceil(value * 100) / 100) {
              return true;
            }
            return `Please select a number with up to 2 digits after period`;
          }
        },
        {
          name: "stock",
          type: "number",
          message: "How many of the product will we stock?",
          validate: function(value) {
            if (isNaN(value) === false && value > 0 && Number.isInteger(value)) {
              return true;
            }
            return `Please select a positive integer`;
          }
        }
      ]).then(function(answer) {
        console.log(answer.item, answer.department, answer.price, answer.stock);
        connection.query(
          "INSERT INTO products SET ?", 
          {
            product_name: answer.item,
            department_name: answer.department,
            price: answer.price,
            stock_quantity: answer.stock
          },
          function(err, res) {
            if (err) throw err;
            resolve(`New item created!\nID: ${res.insertId}\nProduct: ${answer.item}\nDepartment: ${answer.department}\nPrice: ${answer.price}\nStock: ${answer.stock}`);
          }
        )
      })
  })
}



//Handles directing user input to correct function, and returns answer
const managerCommands = function() {
  inquirer
    .prompt({
      name: "command",
      type: "list",
      message: "Welcome to the Manager's portal.  What would you like to do?",
      choices: ["View Products for Sale",
                "View Low Inventory",
                "Add to Inventory", 
                "Add New Product",
                "Exit"
              ]
    }).then(async function(answer) {
      switch(answer.command) {
        case "View Products for Sale":
          let viewProductsMsg = await viewProducts();
          myPrint(viewProductsMsg);
          lineBreak();
          managerCommands();
          break;
        case "View Low Inventory":
          let lowInventoryMsg = await lowInventory();
          myPrint(lowInventoryMsg);
          lineBreak();
          managerCommands();
          break;
        case "Add to Inventory":
          let addInventoryMsg = await addInventory();
          console.log(addInventoryMsg);
          lineBreak();
          managerCommands();
          break;
        case "Add New Product":
          let addNewProdMsg = await addNewProduct();
          console.log(addNewProdMsg);
          lineBreak();
          managerCommands();
          break;
        case "Exit":
          lineBreak();
          console.log("Now Exiting Manager's Portal")
          lineBreak();
          connection.end()
          break;
      }
    })
}



// *************************************//
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected!")
  managerCommands();
})
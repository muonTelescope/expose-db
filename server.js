var http = require("http");
var mysql = require("mysql");
var url = require('url');
var uuid = require('uuid');
var Sequelize = require("sequelize");
var express = require('express');
var config = require('./config');

var dataAccess = require("./dataAccess");

var app = express();


// [
//     detectorObject, dataAcsessInstance
// ]
// 
// {
//     alias: name,
//     apiKey: kdljfslkf-fsjfs-fsfs
//     name: fjslkfjs
//     descriptopn
//     ....
// }


var sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPasswd, {
    host: config.dbHost,
    dialect: config.dbDialect,
    define: {
        // Prevent sequelize from pluralizing table names
        freezeTableName: true
    }
});

// Sync detector model, create table if it does not exist
var detector = sequelize.import(__dirname + "/detector.model.js");
sequelize.sync();

// List of all the tables, they are named by thier alias
var tables = [];
getModels(function (models) {
    for (index in models) {
        tables[index] = sequelize.define(models[index].name, models[index].schema);
    }
    sequelize.sync();
});

var apiKeys = {};
detector
    .findAll({ "attributes": ["alias", "apiKey"] })
    .then(function (detectorKey) {
        for (key in detectorKey) {
            apiKeys[detectorKey[key].alias] = detectorKey[key].apiKey;
        }
    });

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// Base route with info (accessed at GET http://localhost:80/api/db)
router.get('/', function (req, res) {
    res.send("<p>Welcome to the API '/', availible options are /tableName , /add/tableName</p>");
});

router.get('/:tableName', function (req, res) {
    var tableName = req.params.tableName;
    var select = JSON.parse(req.query.select || "{}");
    var type = req.query.type;

    // If the table exists, return it.
    var tableSelected = new dataAccess(getTableByName(tableName));
    if (tableSelected) {
        switch (type) {
            case "json":
                //serve json
                var tableSelected = new dataAccess(getTableByName(tableName));
                tableSelected.select(select).queryAll(function (dataResponse) {
                    res.send(dataResponse.json());
                });
                break;

            case "csv":
                //serve csv                
                var tableSelected = new dataAccess(getTableByName(tableName));
                tableSelected.select(select).queryAll(function (dataResponse) {
                    res.send(dataResponse.csv());
                });
                break;
            case "chart":
                //serve google chart element compatible
                tableSelected.select(select).limitDays(req.query.limitDays).queryAll(function (dataResponse) {
                    res.send(dataResponse.averageMin(req.query.averageMin).chart());
                });
                break;
            case "test":
                var lloydWright = new dataAccess(getTableByName("lloydWright"));
                select = { attributes: ["createdAt", "Zero", "One"], where: { Zero: { $gte: 0 } } };
                lloydWright.select(select).limitDays(0).queryAll(function (dataResponse) {
                    res.send(dataResponse.averageMin(5).chart());
                });
                break;

            default:
                //error, select a type
                res.send("<p>Select parameter \"type\", json,csv.</p>");
        }
    } else {
        var response = { error: "Table does not exist", tables: [] }
        for (index in tables) {
            response.tables.push(tables[index].name);
        }
        res.json(response);
    }
});

router.post('/add/:tableName', function (req, res) {
    var tableName = req.params.tableName;
    //this is where we take data that we get
    if (tableName == "detector") {
        //this is the default table
        req.query.apiKey = uuid.v4();
        //create a new table here
        createTable(req.query.alias, JSON.parse(req.query.fields));

        getTableByName(tableName).create(req.query)
            .then(function (response) {
                res.json(response);
            }, function (err) {
                res.json(err);
            });

    } else if (req.query.apiKey == apiKeys[tableName] && req.query.apiKey != null) {
        //Check if apikey exists
        delete req.query.apiKey;
        getTableByName(tableName).create(req.query)
            .then(function (response) {
                res.json(response);
            }, function (err) {
                res.json(err);
            });

    } else {
        res.json({ error: "apiKey does not match", query: req.query });
    }

});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/db', router);

// START THE SERVER
// =============================================================================
app.listen(config.apiPort);
console.log('Expose DB running on port: ' + config.apiPort);

//look through tablesname to see if we have that table
function getTableByName(tableName) {
    for (index in tables) {
        if (tables[index].name == tableName) {
            return tables[index];
        }
    }
    return null;
}

function createTable(alias, schemaRaw) {
    //define a new table and sync it
    var schema = {};
    for (key in schemaRaw) {
        schema[key] = stringToSequelizeType(schemaRaw[key]);
    }
    var newTable = sequelize.define(alias, schema);
    sequelize.sync().then(function () {
        //rebuild get all the tables
        getModels(function (models) {
            for (index in models) {
                tables[index] = sequelize.define(models[index].name, models[index].schema);
            }
            sequelize.sync();
        });
    });
}

function stringToSequelizeType(stringInput) {
    //type conversion
    switch (stringInput) {
        case "int(11)":
            return Sequelize.INTEGER;
        case "varchar(255)":
            return Sequelize.STRING;
        case "text":
            return Sequelize.TEXT;
        case "tinyint(1)":
            return Sequelize.BOOLEAN;
        case "datetime":
            return Sequelize.DATE;
        default:
    }
}

//Gets the model of a table, and then converts it to a sequelize model
function getModels(callback) {

    var tables = [];
    var tableList = [];

    sequelize.query("SHOW TABLES").then(function (tablesArray) {
        for (table in tablesArray[0]) {
            tableList.push(tablesArray[0][table].Tables_in_cosmic);
        }
        return tableList;
    }).each(function (table) {
        sequelize.query("DESCRIBE " + table).then(function (descriptionList) {
            var tableInfo = {};
            var schema = {};

            for (descriptions in descriptionList[0]) {
                for (fields in descriptionList[0][descriptions]) {
                    var fieldDescription = {};
                    fieldDescription.type = stringToSequelizeType(descriptionList[0][descriptions].Type);


                    if (descriptionList[0][descriptions].Default != null) {
                        fieldDescription.defaultValue = descriptionList[0][descriptions].Default;
                    }

                    if (descriptionList[0][descriptions].Null == "NO") {
                        fieldDescription.allowNull = false;
                    }

                    switch (descriptionList[0][descriptions].Key) {
                        case "PRI":
                            fieldDescription.primaryKey = true;
                            break;
                        case "UNI":
                            fieldDescription.unique = true;
                            break;
                        case "MUL":
                            console.log(JSON.stringify(descriptionList[0][descriptions], null, 2));
                            break;
                    }

                    switch (descriptionList[0][descriptions].Extra) {
                        case "auto_increment":
                            fieldDescription.autoIncrement = true;
                            break;
                        case "":
                            break;
                        default:
                            fieldDescription.comment = descriptionList[0][descriptions].Extra;
                    }

                    schema[descriptionList[0][descriptions].Field] = fieldDescription;
                }
            }

            tableInfo.name = table;
            tableInfo.schema = schema;
            tables.push(tableInfo);
        }).then(function () {
            if (tables.length == tableList.length) {
                callback(tables);
            }
        });
    });

}



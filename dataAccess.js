// Converts 

// One day, midnight last night to midnight tonight 5min averages on the fives
// One week, 7 days ago to now 30m averages on the half hours
// One months, 30 days behind, to now 1 day averages on midnight
// three months, 90 days behind to now day average at midnight
// one year, 365 days to now day average day average at midnight
// five year, weekly averages on sunday
// max, monthly average on hte first


// example call
// (alias, oneDay, 5min averages, pressureCorrected, percentVariation);

//var lloydWright = constructor(alias);
// lloydWright.limitDays(30).query().averageMin(5).pressureCorrect().percentVariation().toChart();
// lloydWright.select({attributes:[createdAt, Zero]}).json();

var Sequelize = require("sequelize");

module.exports = class dataAccess {
    constructor(sequlizeTable) {
        this.table = sequlizeTable;  //the table we can query
        this.alias = "testing"; // find the alias so others can compare
        this.select; //"the queryObject"
        this.data;
    }

    // Returns table json with select element
    select(select) {
        this.select = select;
        return this;
    }

    limitDays(days) {
        this.select.where = this.select.where || {};
        this.select.where.createdAt = this.select.where.createdAt || {};
        // Set to midnight tonight if limit is 0, no limit if negative, otherwise subtract exact number of days.
        if (days >= 0) {
            this.select.where.createdAt.$gte = new Date();
            if (days == 0) {
                this.select.where.createdAt.$gte.setUTCHours(0, 0, 0, 0);
            } else {
                this.select.where.createdAt.$gte.setUTCDate(this.select.where.createdAt.$gte.getUTCDate() - days);
            }
        }
        return this;
    }

    // Returns data in json
    json() {
        return this.data;
    }

    // Return data formatted in csv 
    csv() {
        var buffer = "";
        //Print header
        var headerNumber = 0;
        for (var keys in this.data[0].dataValues) {
            buffer += keys;
            headerNumber++;
            if (headerNumber < Object.keys(this.data[0].dataValues).length) {
                buffer += ",";
            } else {
                buffer += "\r\n";
            }
        }
        for (var line in this.data) {
            var keyNumber = 0;
            for (key in this.data[line].dataValues) {
                buffer += JSON.stringify(this.data[line][key]);
                keyNumber++;
                if (keyNumber < Object.keys(this.data[line].dataValues).length) {
                    buffer += ",";
                } else {
                    buffer += "\r\n";
                }
            }
        }
        return buffer;
    }

    // Returns data formatted for google charts polymer element
    chart() {
        var formattedData = [];
        formattedData.push(Object.keys(this.data[0].dataValues));
        for (var line in this.data) {
            formattedData.push(Object.values(this.data[line].dataValues));
        }
        return formattedData;
    }

    // Find all elements in the table that match 
    queryAll(callback) {
        var self = this;
        this.table.findAll(this.select)
            .then(function (data) {
                self.data = data;
                callback(self);
            },
            function (err) {
                localData = { error: err };
                callback(self);
            });
    }

    // Averages recived data into averages over the bins (currently limited to data having 1 min increments)
    // Also likey wont deal well with breaks in data
    averageMin(minutes) {
        if (minutes <= 60) {
            if (60 % minutes != 0) {
                throw "Average bin must be factor of 60"
            } else if (!this.data) {
                throw "No data, query first"
            } else if (!this.data[0].createdAt) {
                throw "Need to request created at time"
            }
            // Trim data to closest multiple of 'minutes'
            var trimNumber = (minutes - ((new Date(this.data[0].createdAt)).getUTCMinutes() % minutes));
            this.data.splice(0, trimNumber);
        } else {
            //hourly or daily?
        }
        // For every set of 'minutes' ,average all the collums of values
        var formattedData = [];
        var divisor = 0;
        // Start at the exact multiple of the minute from the first instance
        var startDate = new Date(this.data[0].dataValues.createdAt);
        startDate.setUTCSeconds(0, 0);

        for (var line in this.data) {
            if (line == 0) {
                // And push that first line into the array
                formattedData.push(this.data[line]);
            } else if (line == this.data.length - 1) {
                // Last line average remaing data
                average(line);
            } else if ((new Date(this.data[line].dataValues.createdAt)).getTime() - startDate < 60000 * minutes) {
                // If the diffrence between the start and current is less than average time, sum, and increase divisor
                for (key in this.data[line].dataValues) {
                    formattedData[formattedData.length - 1][key] += this.data[line].dataValues[key];
                }
                // Increase the divisor
                divisor++;

            } else {
                average(line)
                // The start time + time has been passed, push a new line onto the formateed data stack
                formattedData.push(this.data[line]);
                // Finally increse the start date to the new start date, incrementing it by minutes
                startDate.setTime(startDate.getTime() + 60000 * minutes);
            }
            function average(line) {
                // Else divide by divisor, and place new item into array
                for (key in formattedData[formattedData.length - 1].dataValues) {
                    // Can not divide by 0
                    formattedData[formattedData.length - 1].dataValues[key] /= divisor + 1;
                }
                // Set the createdAt field to start time
                formattedData[formattedData.length - 1].dataValues.createdAt = new Date(startDate);
                // Reset divisor
                divisor = 0;
            }
        }

        // var maxDate = new Date(this.data[0].dataValues.createdAt);
        // maxDate.setUTCSeconds(0, 0);
        // var numSummed = 0;
        // for (var line in this.data) {
        //     if ((new Date(this.data[line].dataValues.createdAt)).getTime() >= maxDate.getTime()) {
        //         // // Set the maxDate as the timestamp of the old data
        //         // console.log(formattedData[formattedData.length - 1].createdAt) = maxDate;
        //         // The max date has been passed, push a new line onto the formateed data stack
        //         formattedData.push(this.data[line]);
        //         // Increase the max date by the number of minutes to average
        //         maxDate.setTime(maxDate.getTime() + 60000 * minutes);
        //         // Reset the number of values summed (should be in minutes)
        //         numSummed = 1;
        //     } else {
        //         for (key in this.data[line].dataValues) {
        //             if (key != "createdAt") {
        //                 formattedData[formattedData.length - 1][key] += this.data[line].dataValues[key];
        //             }
        //         }
        //         numSummed++;
        //     }
        // }
        this.data = formattedData;
        return this
    }
}


// Raw data to five minuite averages

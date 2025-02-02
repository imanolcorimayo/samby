import * as turf from "@turf/turf";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js"; // ES 2015
dayjs.extend(isBetween);
import sales from "../sales.json" assert { type: "json" };
import orders from "../orders.json" assert { type: "json" };

// Get min shippingDate from sales
const minShippingDate = sales.reduce((acc, sale) => {
  // Use dayjs to compare dates
  if (dayjs(sale.date).isBefore(dayjs(acc))) {
    return sale.date;
  }

  return acc;
}, sales[0].shippingDate);

// Get max
const maxShippingDate = sales.reduce((acc, sale) => {
  // Use dayjs to compare dates
  if (dayjs(sale.date).isAfter(dayjs(acc))) {
    return sale.date;
  }

  return acc;
}, sales[0].shippingDate);

// Create a while loop to create a week by week report
let currentDate = dayjs(minShippingDate).startOf("week");
const maxDate = dayjs(maxShippingDate);
const weekByWeek = {};

// Full list of product ids
const productIds = new Set(sales.map((sale) => sale.product.id));

while (currentDate.isBefore(maxDate)) {
  const nextWeek = currentDate.add(6, "day");
  const weekKey = `${currentDate.format("YYYY-MM-DD")} - ${nextWeek.format("YYYY-MM-DD")}`;

  weekByWeek[weekKey] = {};

  for (const sale of sales) {
    const saleDate = dayjs(sale.date);

    if (saleDate.isBetween(currentDate, nextWeek)) {
      // Add total income per product
      if (!weekByWeek[weekKey][sale.product.id]) {
        weekByWeek[weekKey][sale.product.id] = {
          total_income: 0,
          total_outcome: 0,
          product_name: sale.product.name,
          quantity: 0
        };
      }

      weekByWeek[weekKey][sale.product.id]["total_income"] += sale.sellingPrice * sale.quantity;
      weekByWeek[weekKey][sale.product.id]["total_outcome"] += sale.buyingPrice * sale.quantity;
      weekByWeek[weekKey][sale.product.id]["quantity"] += parseFloat(sale.quantity);
    }

    // Analyze a specific group of products: Papa, Tomate, Cebolla
    // Papa cordoba; Papa tucuman: J0u6q3uAHknaGESu7TcX
    // Papa cepillada; negra; catamarca: KlX03q2aSvZH6BHA15GA
    // Papa negra: Pk49CcnC6KEil0ofOYbf
    // Papa blanca mediana; blanca; lavada: M0bhMooKy1qORwkaJxCa
    // Papa comun: riMc0bcPDq3MZS0bp0aA

    // Tomate perita: vYJnLJarp9IYYegtXlDK
    // Tomate perita chico: e4bVZv0vdWugxNneWIrF
    // Tomate 2da: NmLz1rXod2yFGNzjFmgz

    // Cebolla: Z2V5aKX6u7afQo3dDKie

    // Zanahoria: IqikBrGHEV9K0wUwlsD3
  }

  currentDate = nextWeek.add(1, "day");
}

// Print csv
console.log("week,total_income,total_outcome,product_id,product_name,quantity");
for (const week in weekByWeek) {
  for (const product in weekByWeek[week]) {
    console.log(
      `${week},${weekByWeek[week][product].total_income},${weekByWeek[week][product].total_outcome},${product},${weekByWeek[week][product].product_name},${weekByWeek[week][product].quantity}`
    );
  }
}

// Percentage of presence of products per week
const totalQuantityPerWeek = {};
for (const week in weekByWeek) {
  for (const product in weekByWeek[week]) {
    if (!totalQuantityPerWeek[week]) {
      totalQuantityPerWeek[week] = 0;
    }
    totalQuantityPerWeek[week] += weekByWeek[week][product].quantity;
  }
}

console.log("week,product_id,product_name,percentage");
for (const week in weekByWeek) {
  for (const product in weekByWeek[week]) {
    console.log(
      `${week},${product},${weekByWeek[week][product].product_name},${
        (weekByWeek[week][product].quantity / totalQuantityPerWeek[week]) * 100
      }`
    );
  }
}

// Create csv per product with : Producto id, # semanas vendido, cantidad vendida
console.log("\n\n --------------------------- \n\n");
console.log("product_id,product_name,weeks_sold,total_weeks,quantity_sold");
const totalWeeks = Object.keys(weekByWeek).length;
for (const product of productIds) {
  let weeksSold = 0;
  let quantitySold = 0;
  for (const week in weekByWeek) {
    if (weekByWeek[week][product]) {
      weeksSold++;
      quantitySold += weekByWeek[week][product].quantity;
    }
  }

  console.log(`${product},${weeksSold},${totalWeeks},${quantitySold}`);
}

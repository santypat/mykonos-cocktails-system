import mongoose from "mongoose";
import bcrypt from "bcrypt";

// 🔹 MODELOS (ajusta rutas si es necesario)
import User from "./models/User.js";
import Product from "./models/Product.js";
import Inventory from "./models/Inventory.js";
import Sale from "./models/Sale.js";
import Movement from "./models/Movement.js";
import Shift from "./models/Shift.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/mykonos_db";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 Conectado a MongoDB");

    // 🔥 LIMPIAR TODO
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Inventory.deleteMany(),
      Sale.deleteMany(),
      Movement.deleteMany(),
      Shift.deleteMany()
    ]);

    console.log("🧹 Base de datos limpia");

    // 🔐 USERS
    const password = await bcrypt.hash("admin123", 10);

    const users = await User.insertMany([
      {
        username: "admin",
        password, 
        fullName: "Administrador",
        role: "admin"
      },
      {
        username: "seller1",
        password,
        fullName: "Vendedor 1",
        role: "seller"
      }
    ]);

    console.log("👤 Usuarios creados");

    // 📦 INVENTARIO
    const inventory = await Inventory.insertMany([
      { name: "Azúcar", quantity: 5, unit: "kg", minStock: 2 },
      { name: "Limón", quantity: 50, unit: "unidades", minStock: 20 },
      { name: "Hielo", quantity: 10, unit: "kg", minStock: 3 }
    ]);

    console.log("📦 Inventario creado");

    // 🔗 MAPEAR INSUMOS
    const azucar = inventory.find(i => i.name === "Azúcar");
    const limon = inventory.find(i => i.name === "Limón");
    const hielo = inventory.find(i => i.name === "Hielo");

    // 🍹 PRODUCTOS
    const products = await Product.insertMany([
      {
        name: "Limonada",
        price: 5000,
        category: "Bebidas",
        isActive: true,
        preparation: [
          { ingredient: limon._id, quantity: 2 },
          { ingredient: azucar._id, quantity: 0.1 }
        ]
      },
      {
        name: "Granizado",
        price: 7000,
        category: "Granizados",
        isActive: true,
        preparation: [
          { ingredient: hielo._id, quantity: 0.5 }
        ]
      }
    ]);

    console.log("🍹 Productos creados");

    // ⏱ TURNO ACTIVO
    const shift = await Shift.create({
      user: users[1]._id,
      userName: users[1].fullName,
      startTime: new Date(),
      isActive: true
    });

    console.log("⏱ Turno creado");

    // 💰 VENTA DE EJEMPLO
    const sale = await Sale.create({
  seller: users[1]._id, // 👈 ESTO FALTABA
  sellerName: users[1].fullName,
  invoiceNumber: "F001",
  paymentMethod: "cash",
  items: [
    {
      product: products[0]._id,
      name: products[0].name,
      price: products[0].price,
      quantity: 2,
      subtotal: products[0].price * 2
    }
  ],
  total: products[0].price * 2,
  date: new Date()
});

    console.log("🧾 Venta creada");

    // 💸 MOVIMIENTO DE CAJA
    await Movement.create({
  user: users[1]._id, // 👈 ESTO FALTABA
  userName: users[1].fullName,
  type: "income",
  amount: sale.total,
  paymentMethod: "cash",
  description: `Venta ${sale.invoiceNumber}`,
  category: "Ventas",
  date: new Date()
});

    console.log("💸 Movimiento creado");

    console.log("🚀 SEED COMPLETADO CON ÉXITO");
    process.exit();

  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
};

seed();
import { defineStore } from "pinia";
import { collection, query, where, getDocs, Timestamp, limit, orderBy } from "firebase/firestore";
import { ToastEvents } from "~/interfaces";
import weekOfYear from "dayjs/plugin/weekOfYear";

// Helper function to validate prerequisites
function validatePrerequisites() {
  const user = useCurrentUser();
  const businessId = useLocalStorage("cBId", null);

  if (!businessId.value) {
    return { valid: false, reason: "Missing business ID" };
  }

  if (!user || !user.value) {
    return { valid: false, reason: "User not authenticated" };
  }

  return { valid: true, user, businessId };
}

// Interface for state
interface StockState {
  stockItems: StockItem[];
  stockForecasts: StockForecast[];
  topProducts: StockForecast[];
  aiRecommendations: string | null;
  isLoading: boolean;
  dataFetched: boolean;
  lastFetchDate: Date | null;
}

// Interface for stock item
interface StockItem {
  id: string;
  productName: string;
  currentStock: number;
  stockLevel: number;
  avgWeeklyUsage: number;
  stockCoverageWeeks: number;
  reorderLevel: number;
  status: "ok" | "warning" | "critical";
  price: number;
  cost: number;
  unit: string;
  profitContribution: number;
  projectedStockouts: string | null;
}

// Interface for stock forecast
interface StockForecast extends StockItem {
  totalRevenue: number;
  totalProfit: number;
}

export const useStockStore = defineStore("stock", {
  state: (): StockState => ({
    stockItems: [],
    stockForecasts: [],
    topProducts: [],
    aiRecommendations: null,
    isLoading: false,
    dataFetched: false,
    lastFetchDate: null
  }),

  getters: {
    getStockItems: (state) => state.stockItems,
    getTopProducts: (state) => state.topProducts,
    getAiRecommendations: (state) => state.aiRecommendations,
    isDataFetched: (state) => state.dataFetched
  },

  actions: {
    async fetchStockData() {
      const { $dayjs } = useNuxtApp();
      $dayjs.extend(weekOfYear);

      // Return cached data if it was fetched in the last hour
      if (this.dataFetched && this.lastFetchDate) {
        const now = new Date();
        const diff = now.getTime() - this.lastFetchDate.getTime();
        if (diff < 60 * 60 * 1000) {
          // 1 hour
          return this.stockItems;
        }
      }

      // Validate prerequisites
      const prereq = validatePrerequisites();
      if (!prereq.valid && prereq.reason) {
        useToast(ToastEvents.error, prereq.reason);
        return [];
      } else if (!prereq.valid) {
        useToast(ToastEvents.error, "Error al obtener datos de stock");
        return [];
      }

      this.isLoading = true;

      try {
        const db = useFirestore();
        const { businessId } = prereq;

        if (!businessId) {
          useToast(ToastEvents.error, "ID de negocio no encontrado");
          return [];
        }

        // Get products data
        const productsStore = useProductsStore();
        await productsStore.fetchData();
        const products = productsStore.getProducts;

        // Get orders from the last 3 months
        const threeMonthsAgo = $dayjs().subtract(3, "month").startOf("day").toDate();

        // Fetch completed orders
        const ordersQuery = query(
          collection(db, "pedido"),
          where("businessId", "==", businessId.value),
          where("shippingDate", ">=", Timestamp.fromDate(threeMonthsAgo)),
          where("orderStatus", "==", "entregado"),
          orderBy("shippingDate", "desc")
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          shippingDate: $dayjs(doc.data().shippingDate.toDate()).format("YYYY-MM-DD")
        }));

        // Process product usage over time and calculate forecasts
        const productUsage = this.calculateProductUsage(orders, products);
        const stockForecasts = this.calculateStockForecasts(productUsage, products);

        // Generate AI recommendations
        await this.generateAiRecommendations(stockForecasts, products);

        // Sort by restock priority (low stock items first)
        this.stockItems = stockForecasts.sort((a, b) => {
          // First by status (critical, warning, ok)
          if (a.status !== b.status) {
            if (a.status === "critical") return -1;
            if (b.status === "critical") return 1;
            if (a.status === "warning") return -1;
            if (b.status === "warning") return 1;
          }
          // Then by profit contribution (highest first)
          return b.profitContribution - a.profitContribution;
        });

        // Keep only top 20% of products that generate 80% of profit
        this.topProducts = this.calculateTopProducts(stockForecasts);

        this.dataFetched = true;
        this.lastFetchDate = new Date();

        return this.stockItems;
      } catch (error) {
        console.error("Error fetching stock data:", error);
        useToast(ToastEvents.error, "Error al obtener datos de stock");
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    calculateProductUsage(orders: any, products: any) {
      const { $dayjs } = useNuxtApp();
      const productUsage: any = {};

      // Initialize product usage data
      products.forEach((product: any) => {
        if (product.isAvailable) {
          productUsage[product.id] = {
            id: product.id,
            productName: product.productName,
            usageByWeek: {},
            totalUsage: 0,
            avgWeeklyUsage: 0,
            totalRevenue: 0,
            totalProfit: 0
          };
        }
      });

      // Calculate weekly usage for each product
      orders.forEach((order: any) => {
        const orderWeek = $dayjs(order.shippingDate).week();
        const orderYear = $dayjs(order.shippingDate).year();
        const weekKey = `${orderYear}-${orderWeek}`;

        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((product: any) => {
            const productId = product.productId;
            if (productUsage[productId]) {
              // Update weekly usage
              if (!productUsage[productId].usageByWeek[weekKey]) {
                productUsage[productId].usageByWeek[weekKey] = 0;
              }

              const quantity = parseFloat(product.quantity) || 0;
              productUsage[productId].usageByWeek[weekKey] += quantity;
              productUsage[productId].totalUsage += quantity;

              // Calculate revenue and profit
              const price = parseFloat(product.price) || 0;
              const cost = parseFloat(product.currentCost) || 0;

              productUsage[productId].totalRevenue += price * quantity;
              productUsage[productId].totalProfit += (price - cost) * quantity;
            }
          });
        }
      });

      // Calculate average weekly usage
      Object.values(productUsage).forEach((product: any) => {
        const weeksCount = Object.keys(product.usageByWeek).length || 1;
        product.avgWeeklyUsage = product.totalUsage / weeksCount;
      });

      return productUsage;
    },

    calculateStockForecasts(productUsage: any, products: any) {
      const stockForecasts: Array<any> = [];
      const totalProfit: any = Object.values(productUsage).reduce((sum, product: any) => sum + product.totalProfit, 0);

      products.forEach((product: any) => {
        if (!product.isAvailable) return;

        const usage = productUsage[product.id];
        if (!usage) return;

        // Calculate profit contribution percentage
        const profitContribution = totalProfit > 0 ? (usage.totalProfit / totalProfit) * 100 : 0;

        // Calculate stock coverage in weeks based on current stock and average usage
        const currentStock = parseFloat(product.productStock) || 0;
        const avgWeeklyUsage = usage.avgWeeklyUsage || 0.1; // Avoid division by zero
        const stockCoverageWeeks = currentStock / avgWeeklyUsage;

        // Calculate reorder level (1 weeks of stock)
        const reorderLevel = Math.ceil(avgWeeklyUsage * 1);

        // Determine stock status
        let status = "ok";
        if (stockCoverageWeeks < 1) {
          status = "critical";
        } else if (stockCoverageWeeks < 2) {
          status = "warning";
        }

        stockForecasts.push({
          id: product.id,
          productName: product.productName,
          currentStock,
          stockLevel: Math.floor(currentStock),
          avgWeeklyUsage: Math.round(avgWeeklyUsage * 10) / 10, // Round to 1 decimal
          stockCoverageWeeks: Math.round(stockCoverageWeeks * 10) / 10, // Round to 1 decimal
          reorderLevel,
          status,
          price: parseFloat(product.price) || 0,
          cost: parseFloat(product.cost) || 0,
          reorderCost: parseFloat(product.cost) * reorderLevel,
          unit: product.unit || "unidad",
          profitContribution: Math.round(profitContribution * 10) / 10, // Round to 1 decimal
          projectedStockouts: currentStock < avgWeeklyUsage ? "Esta semana" : null
        });
      });

      return stockForecasts;
    },

    calculateTopProducts(stockForecasts: any) {
      // Sort products by profit contribution (highest first)
      const sortedProducts = [...stockForecasts].sort((a, b) => b.profitContribution - a.profitContribution);

      // Calculate cumulative profit contribution
      let cumulativeProfit = 0;
      const productsWithCumulative = sortedProducts.map((product) => {
        cumulativeProfit += product.profitContribution;
        return {
          ...product,
          cumulativeProfit
        };
      });

      // Get top products that contribute to 80% of profit
      return productsWithCumulative
        .filter((product) => product.cumulativeProfit <= 80)
        .sort((a, b) => {
          // First by status
          if (a.status !== b.status) {
            if (a.status === "critical") return -1;
            if (b.status === "critical") return 1;
            if (a.status === "warning") return -1;
            if (b.status === "warning") return 1;
          }
          // Then by profit contribution
          return b.profitContribution - a.profitContribution;
        });
    },

    async generateAiRecommendations(stockForecasts: any, products: any) {
      // In a real implementation, you might call an AI service or use a more sophisticated algorithm
      // For now, we'll generate simple recommendations based on stock levels

      try {
        const criticalItems = stockForecasts.filter((item: any) => item.status === "critical");
        const warningItems = stockForecasts.filter((item: any) => item.status === "warning");
        const topItems = this.calculateTopProducts(stockForecasts);

        let recommendationsText = "";

        // Critical items recommendations
        if (criticalItems.length > 0) {
          recommendationsText += "### Productos críticos que necesitan reabastecimiento:\n\n";
          criticalItems.forEach((item: any) => {
            recommendationsText += `- **${item.productName}**: Quedan ${item.stockLevel} ${item.unit}. Comprar al menos ${item.reorderLevel} ${item.unit}.\n`;
          });
          recommendationsText += "\n";
        }

        // Warning items recommendations
        if (warningItems.length > 0) {
          recommendationsText += "### Productos con stock bajo para las próximas 2 semanas:\n\n";
          warningItems.forEach((item: any) => {
            recommendationsText += `- **${item.productName}**: Quedan ${item.stockLevel} ${item.unit}, recomendamos comprar ${item.reorderLevel} ${item.unit} más.\n`;
          });
          recommendationsText += "\n";
        }

        // Top products recommendations
        if (topItems.length > 0) {
          recommendationsText += "### Productos top que generan el 80% de las ganancias:\n\n";
          topItems.slice(0, 5).forEach((item: any) => {
            const profitMessage = `Contribuye al ${item.profitContribution}% de las ganancias.`;
            recommendationsText += `- **${item.productName}**: ${profitMessage} Mantén siempre stock de este producto.\n`;
          });
          recommendationsText += "\n";
        }

        // General recommendations
        recommendationsText += "### Recomendaciones generales:\n\n";
        recommendationsText += "- Prioriza la compra de productos críticos y con mayor contribución a las ganancias.\n";
        recommendationsText += "- Considera aumentar el precio de productos con alta demanda y bajo margen.\n";
        recommendationsText += "- Evalúa reducir el stock de productos con baja rotación para optimizar tu capital.\n";

        this.aiRecommendations = recommendationsText;
      } catch (error) {
        console.error("Error generating AI recommendations:", error);
        this.aiRecommendations = "No se pudieron generar recomendaciones en este momento.";
      }
    },

    async reorderStock(productId: any) {
      try {
        const product = this.stockItems.find((item) => item.id === productId);
        if (!product) {
          useToast(ToastEvents.error, "Producto no encontrado");
          return false;
        }

        // You could implement actual reordering logic here, like creating an automated order
        // For now, we'll just show a toast notification
        useToast(
          ToastEvents.success,
          `Añadido ${product.productName} (${product.reorderLevel} ${product.unit}) a la lista de compras`
        );

        return true;
      } catch (error) {
        console.error("Error reordering stock:", error);
        useToast(ToastEvents.error, "Error al reabastecer producto");
        return false;
      }
    }
  }
});

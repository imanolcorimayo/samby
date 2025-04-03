import { defineStore } from "pinia";
import { serverTimestamp, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { StockMovementType, ToastEvents, type StockMovement } from "~/interfaces";

import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // ES 2015
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // ES 2015
import Stock from "~/pages/resumen/stock.vue";

interface Prerequisites {
  valid: boolean;
  reason: any;
  user: any;
  businessId: any;
}

// Helper function to validate prerequisites
function validatePrerequisites() {
  const user = useCurrentUser();
  const businessId = useLocalStorage("cBId", null);

  if (!businessId.value) {
    return { valid: false, reason: "Missing business ID", user: null, businessId: null };
  }

  if (!user || !user.value) {
    return { valid: false, reason: "User not authenticated", user: null, businessId: null };
  }

  return { valid: true, user, businessId, reason: null };
}

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    weeklyData: {
      totalIncome: 0,
      totalEarnings: 0,
      totalProductCosts: 0,
      totalNewClients: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      dailyStats: [],
      productCostVariation: [],
      startDate: "",
      endDate: "",
      productStats: []
    },
    isLoading: false,
    weeklyDataFetched: false,
    clientsCache: new Map() // Used to track all clients for detecting new ones
  }),

  getters: {
    getWeeklyData: (state) => state.weeklyData,
    isWeeklyDataFetched: (state) => state.weeklyDataFetched,
    getLoadingState: (state) => state.isLoading
  },

  actions: {
    async fetchWeeklyRecap(startDate: any, endDate: any) {
      const { $dayjs } = useNuxtApp();
      const productsStore = useProductsStore();
      await productsStore.fetchData();
      $dayjs.extend(isSameOrBefore);
      $dayjs.extend(isSameOrAfter);

      // Validate dates
      if (!startDate || !endDate || !$dayjs(startDate).isValid() || !$dayjs(endDate).isValid()) {
        useToast(ToastEvents.error, "Fechas inválidas");
        return null;
      }

      // Format dates to ensure consistency
      const formattedStartDate = $dayjs(startDate).format("YYYY-MM-DD");
      const formattedEndDate = $dayjs(endDate).format("YYYY-MM-DD");

      // Determine if we should use legacy logic or new stock movement logic
      const CUTOFF_DATE = "2025-03-29";
      const useLegacyLogic = $dayjs(formattedStartDate).isSameOrBefore(CUTOFF_DATE, "day");

      // Validate prerequisites
      const prereq: Prerequisites = validatePrerequisites();
      if (!prereq.valid) {
        useToast(ToastEvents.error, prereq.reason);
        return null;
      }

      this.isLoading = true;

      try {
        const db = useFirestore();
        const { businessId } = prereq;

        // Create date objects for queries
        const startDateTime = $dayjs(formattedStartDate).startOf("day").toDate();
        const endDateTime = $dayjs(formattedEndDate).endOf("day").toDate();

        // Initialize weekly data structure
        const weeklyDataInit: any = {
          totalIncome: 0,
          totalEarnings: 0,
          totalProductCosts: 0,
          totalNewClients: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          dailyStats: [],
          productCostVariation: [],
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          productsStats: []
        };

        // Structure to track daily data
        const dailyData: any = {};

        // Create a day-by-day list of dates in the range
        const days = [];
        let currentDay = $dayjs(formattedStartDate);
        const lastDay = $dayjs(formattedEndDate);

        while (currentDay.isSameOrBefore(lastDay, "day")) {
          const dayStr = currentDay.format("YYYY-MM-DD");
          days.push(dayStr);

          // Initialize data structure for each day
          dailyData[dayStr] = {
            date: dayStr,
            dayName: currentDay.format("dddd"),
            totalIncome: 0,
            totalEarnings: 0,
            earningsPercentage: 0,
            totalClients: 0,
            totalNewClients: 0,
            totalOrders: 0,
            productCosts: 0,
            costCeroExists: false
          };

          currentDay = currentDay.add(1, "day");
        }

        // 1. Fetch orders for the date range
        const ordersQuery = query(
          collection(db, "pedido"),
          where("businessId", "==", businessId.value),
          where("shippingDate", ">=", Timestamp.fromDate(startDateTime)),
          where("shippingDate", "<=", Timestamp.fromDate(endDateTime)),
          where("orderStatus", "in", ["entregado"])
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders: any = ordersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            shippingDate: $dayjs(data.shippingDate.toDate()).format("YYYY-MM-DD")
          };
        });

        // Order ids
        const orderIds = orders.map((el: any) => el.id);

        // Client tracking sets
        const allClientsInPeriod = new Set();

        // Fetch appropriate cost data based on mode
        let productCosts: any = [];
        let stockMovements: any = [];

        if (useLegacyLogic) {
          // 3. Fetch product costs for the date range using legacy method
          const productCostsQuery = query(
            collection(db, "dailyProductCost"),
            where("businessId", "==", businessId.value),
            where("date", ">=", Timestamp.fromDate(startDateTime)),
            where("date", "<=", Timestamp.fromDate(endDateTime))
          );

          const productCostsSnapshot = await getDocs(productCostsQuery);
          productCosts = productCostsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              date: $dayjs(data.date.toDate()).format("YYYY-MM-DD")
            };
          });
        } else {
          // Split the orderIds array into chunks of maximum 30 items
          const chunkSize = 30;
          const orderIdChunks = [];
          for (let i = 0; i < orderIds.length; i += chunkSize) {
            orderIdChunks.push(orderIds.slice(i, i + chunkSize));
          }

          // Create an array to hold all stock movements
          let allStockMovements: Array<any> = [];

          // Query each chunk separately
          for (const chunk of orderIdChunks) {
            if (chunk.length > 0) {
              const stockMovementsQuery = query(
                collection(db, "stockMovements"),
                where("businessId", "==", businessId.value),
                where("orderId", "in", chunk)
              );

              const stockMovementsSnapshot = await getDocs(stockMovementsQuery);
              const chunkMovements = stockMovementsSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  ...data,
                  id: doc.id,
                  date: $dayjs(data.date.toDate()).format("YYYY-MM-DD")
                };
              });

              // Add this chunk's results to the overall results
              allStockMovements = [...allStockMovements, ...chunkMovements];
            }
          }

          // Use allStockMovements instead of the result from a single query
          stockMovements = allStockMovements;
        }

        // 2. Process orders to calculate daily stats
        for (const order of orders) {
          const orderDay = order.shippingDate;

          if (dailyData[orderDay]) {
            dailyData[orderDay].totalIncome += order.totalAmount || 0;
            dailyData[orderDay].totalOrders += 1;

            // Track clients
            if (order.clientId) {
              allClientsInPeriod.add(order.clientId);
              dailyData[orderDay].totalClients += 1;
            }

            // Track products costs - different approaches based on date range
            if (order.products) {
              if (useLegacyLogic) {
                // Legacy logic - use stored costs
                for (const product of order.products) {
                  if (product.productId) {
                    // Find cost for this product on this day
                    const productCost: any = productCosts.find((c: any) => c.productId === product.productId);

                    dailyData[orderDay].totalCosts = dailyData[orderDay].totalCosts || 0;
                    dailyData[orderDay].totalCosts +=
                      (product.currentCost || productCost?.cost || 0) * product.quantity;

                    // Add if exists a cost of 0 to alarm the user
                    if (product.currentCost === 0) {
                      dailyData[orderDay].costCeroExists = true;
                    }
                  }
                }
              } else {
                // New logic - use stock movements
                for (const product of order.products) {
                  if (product.productId && product.stockUsed > 0) {
                    // Find associated stock movements for this order
                    const productMovements = stockMovements.filter(
                      (m: any) =>
                        m.productId === product.productId &&
                        m.orderId === order.id &&
                        (m.type === StockMovementType.SALE || m.type === StockMovementType.RETURN)
                    );

                    let productCost = 0;

                    if (productMovements.length > 0) {
                      // Calculate actual cost from movements
                      productCost = productMovements.reduce((sum: number, movement: any) => {
                        if (movement.type === StockMovementType.RETURN) {
                          const returnCost = movement.unitBuyingPrice || movement.previousCost;
                          // Value that has been given back to the stock
                          return sum - returnCost * Math.abs(movement.quantity);
                        }

                        // Cost is previousCost * abs(quantity) because quantity is negative for sales
                        return sum + movement.previousCost * Math.abs(movement.quantity);
                      }, 0);
                    } else {
                      // Fallback if no movements found
                      const productInStore = productsStore.getProducts.find((p: any) => p.id === product.productId);
                      productCost = (productInStore?.cost || 0) * product.stockUsed;
                    }

                    dailyData[orderDay].totalCosts = dailyData[orderDay].totalCosts || 0;
                    dailyData[orderDay].totalCosts += productCost;

                    // Check if any product has zero cost
                    if (productCost === 0 && product.stockUsed > 0) {
                      dailyData[orderDay].costCeroExists = true;
                    }
                  }
                }
              }
            }
          }
        }

        // Process cost data differently based on approach
        const costsByDay: any = {};
        const productCostHistory: any = {};

        if (useLegacyLogic) {
          // Group product costs by day and product - legacy approach
          for (const cost of productCosts) {
            const costDay = cost.date;

            // Add to daily tally
            if (dailyData[costDay]) {
              if (!costsByDay[costDay]) {
                costsByDay[costDay] = 0;
              }
              costsByDay[costDay] = dailyData[costDay].totalCosts || 0;
            }

            // Track product cost history for variation
            if (!productCostHistory[cost.productId]) {
              productCostHistory[cost.productId] = [];
            }

            productCostHistory[cost.productId].push({
              date: costDay,
              cost: cost.cost
            });
          }
        } else {
          // New approach - track cost changes based on stock "addition" movements
          for (const movement of stockMovements) {
            if (movement.type === StockMovementType.ADDITION) {
              const costDay = movement.date;
              const productId = movement.productId;

              // Only consider addition movements for cost tracking
              if (!productCostHistory[productId]) {
                productCostHistory[productId] = [];
              }

              // Use unitBuyingPrice if available, otherwise use newCost
              const costValue = movement.unitBuyingPrice || movement.newCost;

              productCostHistory[productId].push({
                date: costDay,
                cost: costValue
              });
            }

            // Track daily costs used
            const costDay = movement.date;

            if (!costsByDay[costDay]) {
              costsByDay[costDay] = 0;
            }

            if (movement.type === StockMovementType.SALE && dailyData[costDay]) {
              // For sales, add the cost to the daily tally
              costsByDay[costDay] += Math.abs(movement.quantity) * movement.previousCost;
            } else if (movement.type === StockMovementType.RETURN && dailyData[costDay]) {
              // For returns, subtract the ORIGINAL cost from the daily tally
              const returnCost = movement.unitBuyingPrice || movement.previousCost;
              costsByDay[costDay] -= Math.abs(movement.quantity) * returnCost;
            }
          }
        }

        // 4. Fetch clients to identify new clients
        const clientsQuery = query(collection(db, "clientes"), where("businessId", "==", businessId.value));
        const clientsSnapshot = await getDocs(clientsQuery);

        // Process clients to identify new ones in the period
        clientsSnapshot.docs.forEach((doc) => {
          const clientData = doc.data();
          const clientId = doc.id;

          // Store client data in cache for future reference
          this.clientsCache.set(clientId, {
            ...clientData,
            id: clientId
          });

          // Check if client was created during the period
          if (clientData.createdAt) {
            const creationDate = $dayjs(clientData.createdAt.toDate()).format("YYYY-MM-DD");

            if (
              $dayjs(creationDate).isSameOrAfter(formattedStartDate) &&
              $dayjs(creationDate).isSameOrBefore(formattedEndDate)
            ) {
              weeklyDataInit.totalNewClients++;

              if (dailyData[creationDate]) {
                dailyData[creationDate].totalNewClients++;
              }
            }
          }
        });

        // 5. Calculate earnings based on income and costs
        days.forEach((day) => {
          const dayStats = dailyData[day];
          const dayCosts = costsByDay[day] || 0;

          dayStats.productCosts = dayCosts;
          dayStats.totalEarnings = dayStats.totalIncome - dayCosts;

          // Calculate earnings percentage
          if (dayStats.totalIncome > 0) {
            dayStats.earningsPercentage = (dayStats.totalEarnings / dayStats.totalIncome) * 100;
          }

          // Add to weekly totals
          weeklyDataInit.totalIncome += dayStats.totalIncome;
          weeklyDataInit.totalProductCosts += dayCosts;
        });

        // Calculate overall earnings
        weeklyDataInit.totalEarnings = weeklyDataInit.totalIncome - weeklyDataInit.totalProductCosts;

        // Calculate average order value
        weeklyDataInit.totalOrders = orders.length;
        if (weeklyDataInit.totalOrders > 0) {
          weeklyDataInit.averageOrderValue = weeklyDataInit.totalIncome / weeklyDataInit.totalOrders;
        }

        // 6. Analyze product cost variations
        const productVariations: Array<any> = [];

        Object.entries(productCostHistory).forEach(([productId, history]: any) => {
          if (history.length >= 2) {
            // Sort by date
            history.sort((a: any, b: any) => $dayjs(a.date).diff($dayjs(b.date)));

            const firstCost = history[0].cost;
            const lastCost = history[history.length - 1].cost;
            const absoluteChange = lastCost - firstCost;
            const percentageChange = firstCost > 0 ? (absoluteChange / firstCost) * 100 : 0;

            // Get product name from cache if possible
            let productName = "Producto " + productId.substring(0, 5);

            // Try to get product name from orders
            for (const order of orders) {
              const product = order.products?.find((p: any) => p.productId === productId);
              if (product && product.productName) {
                productName = product.productName;
                break;
              }
            }

            // Fallback to products store
            if (productName.startsWith("Producto ")) {
              const productInStore = productsStore.getProducts.find((p: any) => p.id === productId);
              if (productInStore) {
                productName = productInStore.productName;
              }
            }

            productVariations.push({
              productId,
              productName,
              firstCost,
              lastCost,
              absoluteChange,
              percentageChange,
              history: history
            });
          }
        });

        // Sort by absolute percentage change (descending)
        productVariations.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

        // 7. Track Product Data Individually
        const productData = new Map();

        // Process orders to extract product information
        for (const order of orders) {
          if (order.products) {
            for (const product of order.products) {
              const productId = product.productId;

              if (!productData.has(productId)) {
                productData.set(productId, {
                  productId,
                  productName: product.productName || `Product ${productId.substring(0, 5)}`,
                  totalSold: 0,
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  orderCount: 0,
                  orderFrequency: 0,
                  stockOutsCount: 0,
                  stockOutsFrequency: 0,
                  currentStock: 0
                });
              }

              const productStats = productData.get(productId);
              productStats.totalSold += product.quantity || 0;
              productStats.revenue += (product.price || 0) * (product.quantity || 0);

              // Calculate cost differently based on approach
              if (useLegacyLogic) {
                // Legacy approach - use stored cost
                productStats.cost += (product.currentCost || 0) * (product.quantity || 0);
              } else {
                // New approach - use actual cost from stock movements
                // When calculating product costs from movements
                const productMovements = stockMovements.filter(
                  (m: any) =>
                    m.productId === productId &&
                    (m.type === StockMovementType.SALE || m.type === StockMovementType.RETURN) &&
                    m.orderId === order.id
                );

                if (productMovements.length > 0) {
                  // Calculate actual cost from movements
                  const movementCost = productMovements.reduce((sum: number, movement: StockMovement) => {
                    if (movement.type === StockMovementType.SALE) {
                      return sum + movement.previousCost * Math.abs(movement.quantity);
                    } else if (movement.type === StockMovementType.RETURN) {
                      // Use unitBuyingPrice for returns when available
                      const returnCost = movement.unitBuyingPrice || movement.previousCost;
                      return sum - returnCost * Math.abs(movement.quantity);
                    }
                    return sum;
                  }, 0);

                  productStats.cost += movementCost;
                } else {
                  // Fallback
                  const productInStore = productsStore.getProducts.find((p: any) => p.id === productId);
                  productStats.cost += (productInStore?.cost || 0) * (product.stockUsed || product.quantity || 0);
                }
              }

              // Track unique orders containing this product
              productStats.orderCount += 1;

              // Update current stock if available
              const storeProduct = productsStore.getProducts.find((p: any) => p.id === productId);
              if (storeProduct && typeof storeProduct.productStock !== "undefined" && productStats.currentStock === 0) {
                productStats.currentStock = storeProduct.productStock;
              }

              // Track stock-outs (if stock was 0 or less at the time of order)
              if (useLegacyLogic) {
                if (product.currentProductStock === 0 || product.currentProductStock === product.stockUsed) {
                  productStats.stockOutsCount += 1;
                }
              } else {
                if (product.stockUsed > 0 && product.stockUsed < product.quantity) {
                  // This means we had to create with "requiere-actualizacion-inventario" status
                  productStats.stockOutsCount += 1;
                }
              }
            }
          }
        }

        // Calculate final metrics for each product
        productData.forEach((product) => {
          // Calculate profit
          product.profit = product.revenue - product.cost;

          // Calculate order frequency (percentage of orders that contain this product)
          product.orderFrequency = orders.length > 0 ? ((product.orderCount / orders.length) * 100).toFixed(1) : 0;

          // Calculate stock-outs frequency (percentage of orders with stock-outs)
          product.stockOutsFrequency =
            product.orderCount > 0 ? ((product.stockOutsCount / product.orderCount) * 100).toFixed(1) : 0;
        });

        // Convert Map to array and sort by profit (descending)
        weeklyDataInit.productStats = Array.from(productData.values()).sort((a, b) => b.profit - a.profit);

        // Convert daily data to array and sort by date
        weeklyDataInit.dailyStats = Object.values(dailyData).sort((a: any, b: any) =>
          $dayjs(a.date).diff($dayjs(b.date))
        );

        weeklyDataInit.productCostVariation = productVariations.slice(0, 10); // Top 10 variations

        // Update state
        this.weeklyData = weeklyDataInit;
        this.weeklyDataFetched = true;
        this.isLoading = false;

        return weeklyDataInit;
      } catch (error) {
        console.error("Error fetching weekly recap:", error);
        useToast(ToastEvents.error, "Error al obtener los datos semanales");
        this.isLoading = false;
        return null;
      }
    },

    resetWeeklyData() {
      this.weeklyDataFetched = false;
      this.weeklyData = {
        totalIncome: 0,
        totalEarnings: 0,
        totalProductCosts: 0,
        totalNewClients: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        dailyStats: [],
        productCostVariation: [],
        startDate: "",
        endDate: "",
        productStats: []
      };
    }
  }
});

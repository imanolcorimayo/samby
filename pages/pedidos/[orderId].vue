<template>
  <div class="flex flex-col gap-6 w-full mb-8">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="text-gray-500">Cargando datos del pedido...</span>
    </div>

    <template v-else-if="order">
      <!-- Order Header Section -->
      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-xl font-semibold mb-1">Pedido #{{ orderIdShort }}</h1>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                  :class="getOrderStatusClass(order.orderStatus)"
                >
                  {{ formatStatus(order.orderStatus) }}
                </span>
                <span class="text-sm text-gray-500">{{ $dayjs(order.createdAt).format("DD/MM/YYYY") }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="toggleEditMode" class="btn-sm bg-secondary hover:bg-secondary/80 flex gap-1 items-center">
                <LucidePencil class="w-4 h-4" />
                {{ isEditMode ? "Cancelar edición" : "Editar pedido" }}
              </button>
              <button
                v-if="isEditMode"
                @click="saveChanges"
                class="btn-sm bg-primary text-white hover:bg-primary/90 flex gap-1 items-center"
                :disabled="!hasChanges || saving"
              >
                <LucideSave class="w-4 h-4" />
                {{ saving ? "Guardando..." : "Guardar cambios" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Client & Order Summary Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <!-- Client Information -->
          <div class="flex flex-col">
            <h2 class="font-medium text-gray-700 mb-2">Información del cliente</h2>
            <div class="flex gap-2 items-center mb-1">
              <MingcuteUser4Fill class="text-gray-500" />
              <NuxtLink :to="`/clientes/${order.clientId}`" class="font-medium text-blue-600 hover:underline">
                {{ order.client.clientName }}
              </NuxtLink>
              <span
                v-if="order.client.fromEmprendeVerde"
                class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
              >
                <PhSealCheckDuotone class="text-blue-600" /> App
              </span>
            </div>
            <div class="text-sm text-gray-600 ml-6 mb-1">{{ order.client.phone || "Sin teléfono" }}</div>
            <div class="text-sm text-gray-600 ml-6">{{ order.client.address || "Sin dirección" }}</div>
          </div>

          <!-- Order Summary -->
          <div class="flex flex-col">
            <h2 class="font-medium text-gray-700 mb-2">Resumen del pedido</h2>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <div class="text-sm text-gray-500">Fecha de entrega</div>
                <div class="font-medium">
                  {{ $dayjs(order.shippingDate).format("DD/MM/YYYY") }}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Método de entrega</div>
                <div class="font-medium">
                  {{ order.shippingType || "A convenir" }}
                  <span v-if="order.shippingPrice > 0">({{ formatPrice(order.shippingPrice) }})</span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Total productos</div>
                <div class="font-medium">{{ formatPrice(order.totalProductsAmount) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Total pedido</div>
                <div class="font-medium text-blue-700">{{ formatPrice(order.totalAmount) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Map -->
        <div v-if="order.client.address" class="p-4 pt-0">
          <div class="rounded-lg overflow-hidden border border-gray-200">
            <div class="bg-blue-50 p-2 flex justify-between items-center">
              <h3 class="font-medium text-blue-700">Ubicación de entrega</h3>
              <a
                :href="getMapsUrl(order.client)"
                target="_blank"
                class="text-blue-600 text-sm hover:underline flex items-center gap-1"
              >
                <LucideExternalLink class="w-4 h-4" /> Ver en Google Maps
              </a>
            </div>
            <div class="h-40 bg-gray-100">
              <!-- Map container when coordinates exist -->
              <div v-if="hasClientCoordinates" id="client-location-map" class="h-full"></div>

              <!-- Placeholder when no coordinates -->
              <div v-else class="h-full flex items-center justify-center">
                <span class="text-gray-500">No hay coordenadas disponibles para mostrar el mapa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 class="font-medium">Productos del pedido</h2>
          <button v-if="isEditMode" @click="addProduct" class="btn-sm bg-primary text-white flex items-center gap-1">
            <LucidePlus class="w-4 h-4" />
            Agregar producto
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock usado
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th
                  v-if="isEditMode"
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(product, index) in editableProducts" :key="product.productId" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.productName }}</div>
                      <div class="text-sm text-gray-500">{{ product.unit }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <template v-if="isEditMode">
                    <input
                      type="number"
                      v-model.number="product.quantity"
                      min="0"
                      step="0.01"
                      class="border border-gray-300 rounded-md px-2 py-1 w-20 text-center"
                      @input="recalculateProductTotal(index)"
                    />
                  </template>
                  <template v-else> {{ product.quantity }} {{ product.unit }} </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <span :class="product.stockUsed < product.quantity ? 'text-red-600' : 'text-green-600'">
                    {{ product.stockUsed || 0 }} {{ product.unit }}
                    <span v-if="product.stockUsed < product.quantity" class="text-xs">*</span>
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <template v-if="isEditMode">
                    <input
                      type="number"
                      v-model.number="product.price"
                      min="0"
                      step="0.01"
                      class="border border-gray-300 rounded-md px-2 py-1 w-24 text-right"
                      @input="recalculateProductTotal(index)"
                    />
                  </template>
                  <template v-else>
                    {{ formatPrice(product.price) }}
                  </template>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {{ formatPrice(product.total) }}
                </td>
                <td v-if="isEditMode" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="removeProduct(index)" class="text-red-600 hover:text-red-900">
                    <LucideTrash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <!-- Empty state for products -->
              <tr v-if="editableProducts.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay productos en este pedido</td>
              </tr>
            </tbody>
            <!-- Totals footer -->
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="4" class="px-6 py-3 text-right text-sm font-medium text-gray-700">Subtotal:</td>
                <td class="px-6 py-3 text-right text-sm font-medium">
                  {{ formatPrice(totalProductsAmount) }}
                </td>
                <td v-if="isEditMode"></td>
              </tr>
              <tr>
                <td colspan="4" class="px-6 py-3 text-right text-sm font-medium text-gray-700">Envío:</td>
                <td class="px-6 py-3 text-right text-sm font-medium">
                  <template v-if="isEditMode">
                    <input
                      type="number"
                      v-model.number="editableShippingPrice"
                      min="0"
                      step="0.01"
                      class="border border-gray-300 rounded-md px-2 py-1 w-24 text-right"
                    />
                  </template>
                  <template v-else>
                    {{ formatPrice(order.shippingPrice) }}
                  </template>
                </td>
                <td v-if="isEditMode"></td>
              </tr>
              <tr class="border-t border-gray-200">
                <td colspan="4" class="px-6 py-3 text-right text-sm font-bold text-gray-700">Total:</td>
                <td class="px-6 py-3 text-right text-sm font-bold">
                  {{ formatPrice(totalAmount) }}
                </td>
                <td v-if="isEditMode"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="stockWarning" class="bg-yellow-50 p-3 text-sm text-yellow-700 border-t border-yellow-200">
          <div class="flex items-start gap-2">
            <LucideAlertTriangle class="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p class="font-medium">Advertencia de stock</p>
              <p>
                Algunos productos no tienen stock suficiente. Si guarda estos cambios, el pedido se marcará como
                "Requiere Actualización de Inventario".
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Movements Section -->
      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 class="font-medium">Movimientos de stock</h2>
        </div>

        <div class="p-4">
          <div v-if="loading" class="text-center py-4">
            <span class="text-gray-500">Cargando movimientos...</span>
          </div>
          <div v-else-if="stockMovements.length === 0" class="text-center py-4">
            <span class="text-gray-500">No hay movimientos de stock para este pedido</span>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="movement in stockMovements"
              :key="movement.id"
              class="border border-gray-200 rounded-md p-3 relative"
            >
              <div class="flex justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="getMovementTypeColor(movement.type)"></div>
                  <span class="font-medium">{{ formatMovementType(movement.type) }}</span>
                </div>
                <div class="text-sm text-gray-500">{{ movement.date }}</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div>
                  <div class="text-xs text-gray-500">Producto</div>
                  <div>{{ movement.productName }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Cantidad</div>
                  <div :class="movement.quantity > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ movement.quantity > 0 ? "+" : "" }}{{ movement.quantity }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Stock resultante</div>
                  <div>{{ movement.newStock }}</div>
                </div>
              </div>

              <!-- Cost change details if applicable -->
              <div v-if="movement.previousCost !== movement.newCost" class="mt-2 text-sm">
                <div class="text-xs text-gray-500">Cambio de costo</div>
                <div class="flex gap-3">
                  <span>Anterior: {{ formatPrice(movement.previousCost) }}</span>
                  <span>→</span>
                  <span>Nuevo: {{ formatPrice(movement.newCost) }}</span>
                </div>
              </div>

              <!-- Notes if available -->
              <div v-if="movement.notes" class="mt-2 text-sm">
                <div class="text-xs text-gray-500">Notas</div>
                <div>{{ movement.notes }}</div>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2 mt-3">
                <button
                  @click="revertMovement(movement)"
                  class="btn-xs bg-secondary flex items-center gap-1"
                  :disabled="saving"
                >
                  <LucideUndo2 class="w-3 h-3" />
                  Revertir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status History Section -->
      <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 class="font-medium">Historial de estados</h2>
          <div class="flex gap-2">
            <button
              v-if="canUpdateStatus"
              @click="updateOrderStatus('entregado')"
              class="btn-sm bg-green-600 text-white flex items-center gap-1"
              :disabled="saving"
            >
              <LucideCheck class="w-4 h-4" />
              Marcar como entregado
            </button>
            <button
              v-if="canUpdateStatus"
              @click="updateOrderStatus('cancelado')"
              class="btn-sm bg-red-600 text-white flex items-center gap-1"
              :disabled="saving"
            >
              <LucideX class="w-4 h-4" />
              Cancelar pedido
            </button>
          </div>
        </div>

        <div class="p-4">
          <div v-if="loading" class="text-center py-4">
            <span class="text-gray-500">Cargando historial...</span>
          </div>
          <div v-else-if="statusHistory.length === 0" class="text-center py-4">
            <span class="text-gray-500">No hay historial de estados para este pedido</span>
          </div>
          <div v-else class="relative">
            <!-- Status timeline -->
            <div class="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
            <div class="space-y-6">
              <div v-for="(status, index) in statusHistory" :key="index" class="relative pl-10">
                <div
                  class="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getStatusColor(status.orderStatus)"
                >
                  <component :is="getStatusIcon(status.orderStatus)" class="w-4 h-4 text-white" />
                </div>
                <div class="flex flex-col">
                  <div class="font-medium">{{ formatStatus(status.orderStatus) }}</div>
                  <div class="text-sm text-gray-500">{{ status.createdAt }}</div>
                  <div v-if="status.message" class="text-sm mt-1">{{ status.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- No order found state -->
    <div v-else-if="!loading" class="flex flex-col items-center justify-center py-12">
      <div class="text-center">
        <h2 class="text-xl font-medium text-gray-700 mb-3">Pedido no encontrado</h2>
        <p class="text-gray-500 mb-6">No se pudo encontrar la información de este pedido</p>
        <NuxtLink to="/pedidos" class="btn bg-primary text-white">Volver a la lista de pedidos</NuxtLink>
      </div>
    </div>

    <!-- Product selector modal -->
    <ModalStructure ref="productSelectorModal">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <h3 class="font-semibold text-lg">Agregar producto</h3>
        </div>
      </template>
      <template #default>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col">
            <label class="text-sm text-gray-600 mb-1">Producto</label>
            <div class="relative">
              <input
                type="text"
                v-model="productSearchQuery"
                class="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Buscar productos..."
                @input="searchProducts"
              />
              <div
                v-if="filteredProducts.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  @click="selectProduct(product)"
                >
                  <div class="font-medium">{{ product.productName }}</div>
                  <div class="text-xs text-gray-500">{{ product.unit }} - {{ formatPrice(product.price) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedProduct" class="border border-gray-200 rounded-md p-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  v-model.number="newProductQuantity"
                  min="0.01"
                  step="0.01"
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  @input="calculateNewProductTotal"
                />
              </div>
              <div>
                <label class="text-sm text-gray-600 mb-1">Precio</label>
                <input
                  type="number"
                  v-model.number="newProductPrice"
                  min="0"
                  step="0.01"
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  @input="calculateNewProductTotal"
                />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-sm text-gray-600">Total</div>
              <div class="font-medium">{{ formatPrice(newProductTotal) }}</div>
            </div>

            <div v-if="newProductQuantity > availableStock" class="mt-3 text-sm text-red-600">
              <div class="flex items-center gap-1">
                <LucideAlertTriangle class="w-4 h-4" />
                <span>Stock disponible: {{ availableStock }} {{ selectedProduct.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <button @click="productSelectorModal.closeModal()" class="btn-sm bg-white border border-gray-300">
            Cancelar
          </button>
          <button
            @click="confirmAddProduct"
            class="btn-sm bg-primary text-white"
            :disabled="!selectedProduct || newProductQuantity <= 0 || newProductPrice < 0"
          >
            Agregar producto
          </button>
        </div>
      </template>
    </ModalStructure>

    <!-- Confirmation Modal -->
    <ConfirmDialogue ref="confirmDialogue" />
    <Loader v-if="saving" />
  </div>
</template>

<script setup>
import { ToastEvents, StockMovementType } from "~/interfaces";
import LucidePencil from "~icons/lucide/pencil";
import LucideSave from "~icons/lucide/save";
import LucideExternalLink from "~icons/lucide/external-link";
import LucidePlus from "~icons/lucide/plus";
import LucideTrash2 from "~icons/lucide/trash-2";
import LucideAlertTriangle from "~icons/lucide/alert-triangle";
import LucideUndo2 from "~icons/lucide/undo-2";
import LucideCheck from "~icons/lucide/check";
import LucideX from "~icons/lucide/x";
import LucidePackage from "~icons/lucide/package";
import LucideTruck from "~icons/lucide/truck";
import LucideArchive from "~icons/lucide/archive";
import PhSealCheckDuotone from "~icons/ph/seal-check-duotone";
import MingcuteUser4Fill from "~icons/mingcute/user-4-fill";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

// ----- Define Pinia Stores -----
const ordersStore = useOrdersStore();
const productsStore = useProductsStore();
const clientsStore = useClientsStore();
const { $dayjs, $leafletHelper } = useNuxtApp();

// ----- Route params -----
const route = useRoute();
const orderId = route.params.orderId;
const orderIdShort = computed(() => orderId.substring(0, 6));

// ----- Refs and reactive state -----
const loading = ref(true);
const saving = ref(false);
const isEditMode = ref(false);
const order = ref(null);
const originalOrder = ref(null);
const editableProducts = ref([]);
const editableShippingPrice = ref(0);
const stockMovements = ref([]);
const statusHistory = ref([]);
const clientDetails = ref(null);
const mapInstance = ref(null);

// Product selector modal
const productSelectorModal = ref(null);
const confirmDialogue = ref(null);
const productSearchQuery = ref("");
const filteredProducts = ref([]);
const selectedProduct = ref(null);
const newProductQuantity = ref(1);
const newProductPrice = ref(0);
const newProductTotal = ref(0);
const availableStock = ref(0);

// ----- Computed properties -----
const totalProductsAmount = computed(() => {
  if (!editableProducts.value.length) return 0;
  return editableProducts.value.reduce((sum, product) => sum + product.total, 0);
});

const totalAmount = computed(() => {
  return totalProductsAmount.value + (isEditMode.value ? editableShippingPrice.value : order.value?.shippingPrice || 0);
});

const hasChanges = computed(() => {
  if (!originalOrder.value) return false;

  // Check if products have changed
  const productsChanged = JSON.stringify(editableProducts.value) !== JSON.stringify(originalOrder.value.products);

  // Check if shipping price has changed
  const shippingPriceChanged = editableShippingPrice.value !== originalOrder.value.shippingPrice;

  return productsChanged || shippingPriceChanged;
});

const stockWarning = computed(() => {
  if (!isEditMode.value || !editableProducts.value.length) return false;

  // Check if any product doesn't have enough stock
  return editableProducts.value.some((product) => {
    const productInStore = productsStore.getProducts.find((p) => p.id === product.productId);
    if (!productInStore) return false;

    // Get current stock from products store
    const currentStock = parseFloat(productInStore.productStock || 0);

    // If this is a new product or increased quantity
    const originalProduct = originalOrder.value.products.find((p) => p.productId === product.productId);
    const originalQuantity = originalProduct ? originalProduct.quantity : 0;
    const stockNeeded = Math.max(0, product.quantity - originalQuantity);

    return stockNeeded > currentStock;
  });
});

const canUpdateStatus = computed(() => {
  if (!order.value) return false;
  return [
    "pendiente",
    "pendiente-modificado",
    "pendiente-de-confirmacion",
    "requiere-actualizacion-inventario"
  ].includes(order.value.orderStatus);
});
// Check if client has coordinates
const hasClientCoordinates = computed(() => {
  if (!order.value || !order.value.client) return false;

  // Check for coordinates in embedded client object
  if (order.value.client.lat && order.value.client.lng) return true;

  // Check for coordinates in clientDetails from store
  if (clientDetails.value && clientDetails.value.lat && clientDetails.value.lng) return true;

  return false;
});

// Get client coordinates (prioritize clientDetails from store)
const clientCoordinates = computed(() => {
  if (clientDetails.value && clientDetails.value.lat && clientDetails.value.lng) {
    return {
      lat: parseFloat(clientDetails.value.lat),
      lng: parseFloat(clientDetails.value.lng)
    };
  }

  if (order.value && order.value.client && order.value.client.lat && order.value.client.lng) {
    return {
      lat: parseFloat(order.value.client.lat),
      lng: parseFloat(order.value.client.lng)
    };
  }

  return null;
});

// ----- Methods -----

// Fetch order data
async function fetchOrderData() {
  loading.value = true;

  try {
    // First check if the order is in pending orders
    if (!ordersStore.arePendingOrdersFetched) {
      await ordersStore.fetchPendingOrders();
    }

    // Search in pending orders first
    let foundOrder = ordersStore.getPendingOrders.find((o) => o.id === orderId);

    // If not found in pending, search in completed orders
    if (!foundOrder) {
      if (!ordersStore.areOrdersFetched) {
        await ordersStore.fetchOrders();
      }
      foundOrder = ordersStore.getOrders.find((o) => o.id === orderId);
    }

    if (foundOrder) {
      order.value = JSON.parse(JSON.stringify(foundOrder)); // Deep copy
      originalOrder.value = JSON.parse(JSON.stringify(foundOrder)); // Another deep copy for comparison
      editableProducts.value = JSON.parse(JSON.stringify(foundOrder.products || []));
      editableShippingPrice.value = foundOrder.shippingPrice || 0;

      // Fetch related stock movements
      await fetchStockMovements();

      // Fetch status history
      await fetchStatusHistory();
    } else {
      useToast(ToastEvents.error, "Pedido no encontrado");
    }
  } catch (error) {
    console.error("Error fetching order data:", error);
    useToast(ToastEvents.error, "Error al cargar los datos del pedido");
  } finally {
    loading.value = false;
  }
}

// Fetch client details from store
async function fetchClientDetails(clientId) {
  // Ensure client data is loaded
  if (!clientsStore.areClientsFetched) {
    await clientsStore.fetchData();
  }

  // Find client in store
  const client = clientsStore.getClients.find((c) => c.id === clientId);
  if (client) {
    clientDetails.value = client;
  }
}

// Initialize the map with client coordinates
async function initializeMap() {
  if (!hasClientCoordinates.value) return;

  const coords = clientCoordinates.value;

  // Clear any existing map
  if (mapInstance.value) {
    mapInstance.value.remove();
    mapInstance.value = null;
  }

  // Initialize map with client location
  mapInstance.value = await $leafletHelper.selectLocationMap(
    "client-location-map",
    {
      modify: false,
      updateLocation: () => {} // Empty function as we're not modifying
    },
    [coords.lat, coords.lng]
  );
}
// Get Google Maps URL based on client data
function getMapsUrl(client) {
  if (client.lat && client.lng) {
    // If we have coordinates, use them directly
    return `https://www.google.com/maps?q=${client.lat},${client.lng}`;
  } else if (client.address) {
    // Otherwise use the address as a search query
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`;
  }

  return "#";
}

async function fetchStockMovements() {
  try {
    // Make sure we have products data
    if (!productsStore.areProductsFetched) {
      await productsStore.fetchData();
    }

    // Fetch stock movements specifically for this order
    // The products store may already have this if we previously fetched for pending orders
    let orderMovements = productsStore.getStockMovements.filter((m) => m.orderId === orderId);

    if (orderMovements.length === 0) {
      // We need to fetch movements specifically for this order
      // This is a custom implementation to fetch by orderId, which doesn't currently exist
      // Let's make a specialized version for just this order

      const db = useFirestore();
      const businessId = useLocalStorage("cBId", null);

      if (businessId.value) {
        const { $dayjs } = useNuxtApp();
        const q = query(
          collection(db, "stockMovements"),
          where("businessId", "==", businessId.value),
          where("orderId", "==", orderId),
          orderBy("date", "desc")
        );

        const querySnapshot = await getDocs(q);
        orderMovements = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            date: data.date ? $dayjs(data.date.toDate()).format("DD/MM/YYYY HH:mm") : null,
            createdAt: data.createdAt ? $dayjs(data.createdAt.toDate()).format("DD/MM/YYYY HH:mm") : null
          };
        });
      }
    }

    stockMovements.value = orderMovements;
  } catch (error) {
    console.error("Error fetching stock movements:", error);
  }
}

async function fetchStatusHistory() {
  try {
    const db = useFirestore();
    const statusLogsCollection = collection(db, `pedido/${orderId}/pedidoStatusLog`);
    const q = query(statusLogsCollection, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    statusHistory.value = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? $dayjs(data.createdAt.toDate()).format("DD/MM/YYYY HH:mm") : null
      };
    });
  } catch (error) {
    console.error("Error fetching status history:", error);
  }
}

// UI interactions
function toggleEditMode() {
  if (isEditMode.value) {
    // If we're exiting edit mode, reset to original values
    editableProducts.value = JSON.parse(JSON.stringify(originalOrder.value.products || []));
    editableShippingPrice.value = originalOrder.value.shippingPrice || 0;
  }
  isEditMode.value = !isEditMode.value;
}

function recalculateProductTotal(index) {
  const product = editableProducts.value[index];
  product.total = product.quantity * product.price;
}

function removeProduct(index) {
  editableProducts.value.splice(index, 1);
}

async function saveChanges() {
  if (!hasChanges.value || saving.value) return;

  // Confirm before saving
  const confirmed = await confirmDialogue.value.openDialog({
    title: "Confirmar cambios",
    message: "¿Estás seguro de que deseas guardar los cambios en este pedido?",
    edit: true
  });

  if (!confirmed) return;

  saving.value = true;

  try {
    // Prepare updated order object
    const updatedOrder = {
      ...originalOrder.value,
      products: editableProducts.value,
      shippingPrice: editableShippingPrice.value,
      totalProductsAmount: totalProductsAmount.value,
      totalAmount: totalAmount.value
    };

    // Update order in Firestore
    const success = await ordersStore.updatePendingOrder(updatedOrder, originalOrder.value);

    if (success) {
      // Update local data
      order.value = JSON.parse(JSON.stringify(updatedOrder));
      originalOrder.value = JSON.parse(JSON.stringify(updatedOrder));

      // Refresh stock movements to see the changes
      await fetchStockMovements();
      await fetchStatusHistory();

      useToast(ToastEvents.success, "Pedido actualizado correctamente");
      isEditMode.value = false;
    } else {
      useToast(ToastEvents.error, "Error al actualizar el pedido");
    }
  } catch (error) {
    console.error("Error saving changes:", error);
    useToast(ToastEvents.error, "Error al guardar los cambios");
  } finally {
    saving.value = false;
  }
}

async function updateOrderStatus(newStatus) {
  if (saving.value) return;

  const statusText = newStatus === "entregado" ? "entregado" : "cancelado";

  // Confirm before updating status
  const confirmed = await confirmDialogue.value.openDialog({
    title: `Confirmar cambio de estado`,
    message: `¿Estás seguro de que deseas marcar este pedido como ${statusText}?`,
    edit: true
  });

  if (!confirmed) return;

  saving.value = true;

  try {
    const success = await ordersStore.updateStatusOrder(orderId, newStatus);

    if (success) {
      // Refresh order data
      await fetchOrderData();
      useToast(ToastEvents.success, `Pedido marcado como ${statusText} correctamente`);
    } else {
      useToast(ToastEvents.error, "Error al actualizar el estado del pedido");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    useToast(ToastEvents.error, "Error al actualizar el estado del pedido");
  } finally {
    saving.value = false;
  }
}

async function revertMovement(movement) {
  if (saving.value) return;

  // Confirm before reverting
  const confirmed = await confirmDialogue.value.openDialog({
    title: "Confirmar reversión",
    message: "¿Estás seguro de que deseas revertir este movimiento de stock? Esta acción no se puede deshacer.",
    edit: true
  });

  if (!confirmed) return;

  saving.value = true;

  try {
    // Get the current product data
    const product = productsStore.getProducts.find((p) => p.id === movement.productId);

    if (!product) {
      useToast(ToastEvents.error, "Producto no encontrado");
      return;
    }

    // Calculate new stock and cost after reverting
    let newStock = parseFloat(product.productStock || 0);
    let newCost = parseFloat(product.cost || 0);

    // Revert based on movement type
    if (movement.type === StockMovementType.SALE) {
      // For sale, add the quantity back
      newStock += Math.abs(movement.quantity);

      // For cost, we need to calculate a weighted average
      // We're adding stock back at the original cost
      const currentValue = newStock * newCost;
      const returnedValue = Math.abs(movement.quantity) * movement.previousCost;
      newCost = (currentValue + returnedValue) / (newStock + Math.abs(movement.quantity));
    } else if (movement.type === StockMovementType.RETURN) {
      // For return, remove the quantity
      newStock -= movement.quantity;

      // Keep the original cost (the reversion should apply a new weighted average)
    }

    // Create a reversion movement
    const reversionType = movement.type === StockMovementType.SALE ? StockMovementType.RETURN : StockMovementType.SALE;

    await productsStore.updateStockWithMovement(
      {
        productStock: newStock,
        cost: newCost
      },
      product,
      {
        type: reversionType,
        notes: `Reversión de movimiento #${movement.id}`,
        quantity: movement.type === StockMovementType.SALE ? Math.abs(movement.quantity) : -movement.quantity,
        orderId: orderId
      }
    );

    // Also need to update the product's stockUsed in the order if it's a SALE reversion
    if (movement.type === StockMovementType.SALE) {
      const updatedOrder = JSON.parse(JSON.stringify(order.value));
      const productIndex = updatedOrder.products.findIndex((p) => p.productId === movement.productId);

      if (productIndex !== -1) {
        const stockUsed = parseFloat(updatedOrder.products[productIndex].stockUsed || 0);
        updatedOrder.products[productIndex].stockUsed = Math.max(0, stockUsed - Math.abs(movement.quantity));

        // Update the order in Firestore
        const db = useFirestore();
        await updateDoc(doc(db, "pedido", orderId), {
          products: updatedOrder.products
        });

        // Update local state
        order.value = updatedOrder;
        originalOrder.value = updatedOrder;
        editableProducts.value = JSON.parse(JSON.stringify(updatedOrder.products));
      }
    }

    // Refresh stock movements
    await fetchStockMovements();

    useToast(ToastEvents.success, "Movimiento revertido correctamente");
  } catch (error) {
    console.error("Error reverting movement:", error);
    useToast(ToastEvents.error, "Error al revertir el movimiento");
  } finally {
    saving.value = false;
  }
}

// Product selector methods
function searchProducts() {
  if (!productSearchQuery.value.trim()) {
    filteredProducts.value = [];
    return;
  }

  const query = productSearchQuery.value.toLowerCase();
  filteredProducts.value = productsStore.getProducts
    .filter(
      (p) => p.isAvailable && (p.productName.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query))
    )
    .slice(0, 10);
}

function selectProduct(product) {
  selectedProduct.value = product;
  newProductPrice.value = product.price || 0;
  newProductQuantity.value = 1;
  availableStock.value = parseFloat(product.productStock || 0);
  calculateNewProductTotal();
  filteredProducts.value = [];
}

function calculateNewProductTotal() {
  newProductTotal.value = newProductQuantity.value * newProductPrice.value;
}

function addProduct() {
  productSearchQuery.value = "";
  selectedProduct.value = null;
  newProductQuantity.value = 1;
  newProductPrice.value = 0;
  newProductTotal.value = 0;

  productSelectorModal.value.showModal();
}

function confirmAddProduct() {
  if (!selectedProduct.value) return;

  // Check if product already exists in the order
  const existingIndex = editableProducts.value.findIndex((p) => p.productId === selectedProduct.value.id);

  if (existingIndex !== -1) {
    // Update existing product
    editableProducts.value[existingIndex].quantity += newProductQuantity.value;
    editableProducts.value[existingIndex].price = newProductPrice.value;
    editableProducts.value[existingIndex].total =
      editableProducts.value[existingIndex].quantity * newProductPrice.value;
  } else {
    // Add new product
    editableProducts.value.push({
      productId: selectedProduct.value.id,
      productName: selectedProduct.value.productName,
      unit: selectedProduct.value.unit,
      quantity: newProductQuantity.value,
      price: newProductPrice.value,
      total: newProductTotal.value,
      stockUsed: 0
    });
  }

  productSelectorModal.value.closeModal();
}

// Helper methods

function formatStatus(status) {
  switch (status) {
    case "entregado":
      return "Entregado";
    case "cancelado":
      return "Cancelado";
    case "rechazado":
      return "Rechazado";
    case "pendiente":
      return "Pendiente";
    case "pendiente-modificado":
      return "Pendiente (modificado)";
    case "pendiente-de-confirmacion":
      return "Pendiente de confirmación";
    case "requiere-actualizacion-inventario":
      return "Requiere Actualización de Inventario";
    default:
      return status;
  }
}

function getOrderStatusClass(status) {
  switch (status) {
    case "entregado":
      return "bg-green-50 text-green-800 ring-1 ring-green-600/20";
    case "cancelado":
    case "rechazado":
      return "bg-red-50 text-red-800 ring-1 ring-red-600/20";
    case "pendiente-de-confirmacion":
      return "bg-blue-50 text-blue-800 ring-1 ring-blue-600/20";
    case "pendiente":
    case "pendiente-modificado":
      return "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20";
    case "requiere-actualizacion-inventario":
      return "bg-orange-50 text-orange-800 ring-1 ring-orange-600/20";
    default:
      return "bg-gray-50 text-gray-800 ring-1 ring-gray-600/20";
  }
}

function getMovementTypeColor(type) {
  switch (type) {
    case StockMovementType.ADDITION:
      return "bg-green-500";
    case StockMovementType.SALE:
      return "bg-blue-500";
    case StockMovementType.LOSS:
      return "bg-red-500";
    case StockMovementType.RETURN:
      return "bg-yellow-500";
    case StockMovementType.ADJUSTMENT:
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

function formatMovementType(type) {
  switch (type) {
    case StockMovementType.ADDITION:
      return "Adición";
    case StockMovementType.SALE:
      return "Venta";
    case StockMovementType.LOSS:
      return "Pérdida";
    case StockMovementType.RETURN:
      return "Devolución";
    case StockMovementType.ADJUSTMENT:
      return "Ajuste";
    default:
      return type;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "entregado":
      return "bg-green-500";
    case "cancelado":
    case "rechazado":
      return "bg-red-500";
    case "pendiente-de-confirmacion":
      return "bg-blue-500";
    case "pendiente":
    case "pendiente-modificado":
      return "bg-yellow-500";
    case "requiere-actualizacion-inventario":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "entregado":
      return LucideCheck;
    case "cancelado":
    case "rechazado":
      return LucideX;
    case "pendiente-de-confirmacion":
      return LucidePackage;
    case "pendiente":
    case "pendiente-modificado":
      return LucideTruck;
    case "requiere-actualizacion-inventario":
      return LucideArchive;
    default:
      return LucidePackage;
  }
}

// ----- Lifecycle hooks -----
onMounted(async () => {
  // Make sure we have products data first
  if (!productsStore.areProductsFetched) {
    await productsStore.fetchData();
  }

  // Fetch order data
  await fetchOrderData();
});

// Clean up map instance when component is destroyed
onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove();
    mapInstance.value = null;
  }
});

useHead({
  title: "Detalle de pedido"
});
</script>

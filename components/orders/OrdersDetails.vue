<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
        <div class="flex flex-col gap-2 w-full">
          <div class="flex flex-col cursor-pointer w-full">
            <span class="font-bold text-xl">Detalles del pedido</span>
          </div>
          <div class="flex flex-col cursor-pointer w-full">
            <NuxtLink :to="`/pedidos/${currentOrder.id}`">
              <span class="text-xs text-gray-500">Pedido id: {{ currentOrder.id }}</span>
            </NuxtLink>
          </div>
        </div>
        <span
          class="h-fit inline-flex items-center rounded-md px-2 py-1 font-semibold ring-1 ring-inset text-center text-nowrap"
          :class="{
            'bg-green-50 text-green-800 ring-green-600/20': currentOrder.orderStatus == 'entregado',
            'bg-red-50 text-red-800 ring-red-600/20': ['cancelado', 'rechazado'].includes(currentOrder.orderStatus),
            'bg-blue-50 text-blue-800 ring-blue-600/20': currentOrder.orderStatus == 'pendiente-de-confirmacion',
            'bg-yellow-50 text-yellow-800 ring-yellow-600/20': ['pendiente', 'pendiente-modificado'].includes(
              currentOrder.orderStatus
            )
          }"
        >
          {{ formatStatus(currentOrder.orderStatus) }}</span
        >
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4 mb-4">
        <div v-if="needsInventoryUpdate" class="bg-orange-50 border-2 border-orange-400 p-4 rounded-lg">
          <div class="text-orange-800 flex flex-col gap-2">
            <div class="flex items-start gap-2">
              <MaterialSymbolsWarningRounded class="text-orange-600 text-xl flex-shrink-0 mt-0.5" />
              <span class="font-medium">Este pedido requiere actualización de inventario</span>
            </div>
            <p>Los siguientes productos exceden el stock disponible:</p>
            <ul class="ml-6 list-disc">
              <li v-for="product in productsNeedingStock" :key="product.productId">
                <span class="font-medium">{{ product.productName }}</span
                >:
                <span class="text-red-600">
                  Stock usado: {{ formatQuantity(product.stockUsed || 0) }}, Necesario:
                  {{ formatQuantity(product.quantity) }} (Faltan
                  {{ formatQuantity(product.quantity - (product.stockUsed || 0)) }})
                </span>

                <!-- Add current inventory status -->
                <span
                  v-if="getCurrentInventoryStock(product.productId)"
                  :class="{
                    'text-green-600': canCoverProduct(product),
                    'text-red-600': !canCoverProduct(product)
                  }"
                  class="block ml-6 text-sm"
                >
                  Inventario actual: {{ formatQuantity(getCurrentInventoryStock(product.productId)) }}
                  <span v-if="canCoverProduct(product)"> (Suficiente para cubrir) </span>
                  <span v-else> (Insuficiente) </span>
                </span>
              </li>
            </ul>
            <div class="flex justify-between items-center mt-2">
              <span class="text-sm">
                {{
                  canUpdateToPending
                    ? "Hay stock suficiente para actualizar el pedido a Pendiente"
                    : "No hay stock suficiente para actualizar el pedido"
                }}
              </span>
              <div class="flex gap-2">
                <button
                  @click="refreshProductData"
                  class="btn-sm bg-secondary ring-1 ring-gray-400 text-sm flex items-center gap-1"
                  title="Actualizar estado de inventario"
                >
                  <IconRefresh class="text-black text-xs" /> Actualizar
                </button>
                <NuxtLink
                  to="/inventario"
                  class="btn-sm bg-secondary ring-1 ring-orange-500 text-sm"
                  @click="mainModal.closeModal()"
                >
                  Ir a Inventario
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Resumen del pedido</span>
          <table>
            <thead>
              <tr class="text-gray-400 border-b">
                <th class="font-medium text-start">Nombre Producto</th>
                <th class="font-medium hidden sm:block">Precio</th>
                <th class="font-medium">Cantidad</th>
                <th class="font-medium flex flex-col items-center justify-center">
                  <span>Subtotal</span>
                  <span class="text-xs block sm:hidden">(p/ unidad)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                class="text-center border-b"
                v-for="product in editableOrder.products"
                :key="product.id"
                :class="{ 'bg-orange-50': needsInventoryUpdate && productNeedsMoreStock(product) }"
              >
                <td class="py-3 text-start">
                  <div class="flex flex-col">
                    <div>
                      {{ `${product.productName} (${product.unit})` }}
                      <span
                        v-if="needsInventoryUpdate && productNeedsMoreStock(product)"
                        class="text-xs text-orange-700 block"
                      >
                        Falta stock: {{ formatQuantity(product.quantity - (product.stockUsed || 0)) }}
                      </span>
                    </div>
                    <span class="text-xs">Costo: {{ getCurrentProductCost(product.productId) }}</span>
                  </div>
                </td>
                <td class="py-3 hidden sm:block max-w-[7rem] mx-auto">
                  <div class="relative" v-if="isEditable">
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      v-model="product.price"
                      class="!py-[0.214rem] !px-[0.428rem] max-h-[2.143rem] !pl-6"
                    />
                  </div>
                  <span v-else>${{ formatPrice(product.price) }}</span>
                </td>
                <td class="py-3">
                  <div class="flex justify-between items-center gap-2 w-full" v-if="isEditable">
                    <button
                      @click="manageProduct(product.productId, 'remove')"
                      class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                    >
                      <MiRemove v-if="product.quantity > 1" class="text-black text-xs" />
                      <TablerTrash v-else class="text-black text-xs" />
                    </button>
                    <span
                      class="w-full bg-secondary text-sm py-[0.214rem] px-[0.428rem] rounded-[0.214rem] ring-1 ring-gray-500 text-center text-nowrap max-h-[2.143rem]"
                      >{{ product.quantity }}</span
                    >
                    <button
                      @click="manageProduct(product.productId, 'add')"
                      class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                    >
                      <TablerPlus class="text-black text-xs" />
                    </button>
                  </div>
                  <span v-else>{{ product.quantity }}</span>
                </td>
                <td class="py-3">
                  <div class="flex flex-col items-center justify-center">
                    <span>{{ formatPrice(product.total) }}</span>
                    <span class="text-xs block sm:hidden">({{ formatPrice(product.price) }})</span>
                  </div>
                </td>
              </tr>
              <tr class="text-center border-b" v-if="isEditable">
                <td class="py-3 text-start">
                  <Autocomplete
                    :items="autocompleteProducts"
                    property="productNameWithUnit"
                    placeholder="+ Nuevo Producto"
                    returnValue="id"
                    clearOnSelect
                    @selected="addProduct"
                    @unselect="onUnselect"
                  />
                </td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3"></td>
              </tr>
              <tr
                class="text-center border-b"
                v-if="
                  editableOrder.shippingType == ORDER_SHIPPING_TYPES_UTILS.delivery || currentOrder.shippingPrice > 0
                "
              >
                <td class="py-3 text-start">Envío</td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3 py-3 flex items-center gap-2 max-w-[10rem]">
                  <div class="relative mx-auto">
                    <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      v-model="editableOrder.shippingPrice"
                      type="number"
                      class="text-center !py-[0.214rem] !px-[0.428rem] max-h-[2.143rem] !pl-6"
                      placeholder="Ej: 1000"
                    />
                  </div>
                </td>
              </tr>
              <tr class="text-center border-b font-bold">
                <td class="py-3 text-start">Total</td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3">{{ formatPrice(editableOrder.totalAmount ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Método de entrega</span>
          <div v-if="editableOrder.shippingType === ORDER_SHIPPING_TYPES_UTILS.pickup" class="flex gap-1">
            <span class="font-medium">{{ editableOrder.shippingType }}</span>
          </div>
          <div
            v-else-if="
              editableOrder.shippingType === ORDER_SHIPPING_TYPES_UTILS.delivery || editableOrder.shippingPrice > 0
            "
            class="flex gap-1"
          >
            <span class="font-medium">{{ ORDER_SHIPPING_TYPES_UTILS.delivery }}:</span>
            <span>{{ formatPrice(editableOrder.shippingPrice) }}</span>
          </div>
          <div v-else class="flex gap-1">
            <span class="font-medium">A convenir</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Datos del cliente</span>
          <div class="flex gap-1">
            <span class="font-medium">Nombre:</span>
            <span>{{ currentOrder.client.clientName }}</span>
          </div>
          <div class="flex gap-1">
            <span class="font-medium">Teléfono:</span>
            <span>{{ currentOrder.client.phone }}</span>
          </div>
          <div class="flex gap-1">
            <span class="font-medium">Dirección:</span>
            <span>{{ currentOrder.client.address ?? "N/A" }}</span>
          </div>
        </div>
        <div class="flex-1 flex flex-col gap-2 w-fit">
          <FormKit
            type="date"
            name="shipping_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-fit"
            label="Fecha de entrega"
            placeholder="yyyy-mm-dd"
            validation="required"
            v-model="editableOrder.shippingDate"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting && isOrderModified && isEditable" class="btn bg-secondary border text-center">
        loading...
      </div>
      <button
        v-else-if="isOrderModified && isEditable"
        @click="modifyOrder()"
        class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-primary text-white w-full text-center"
      >
        <LucideEdit /> Modificar
      </button>
      <!-- Pending of confirmation -->
      <div class="flex justify-between gap-1" v-if="currentOrder.orderStatus !== 'pendiente-de-confirmacion'">
        <!-- Cancel button remains unchanged -->
        <button
          v-if="!isOrderModified && isEditable"
          @click="updateStatus('cancelado')"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
        >
          <IcRoundArchive /> Cancelar venta
        </button>

        <!-- Mark as delivered or update inventory buttons -->
        <button
          v-if="!isOrderModified && isEditable && !needsInventoryUpdate"
          @click="updateStatus('entregado')"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          <IconParkOutlineCheckOne /> Marcar entregado
        </button>
        <button
          v-else-if="!isOrderModified && isEditable && needsInventoryUpdate && canUpdateToPending"
          @click="updateStatus('pendiente')"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          <IconParkOutlineCheckOne /> Actualizar a Pendiente
        </button>
        <button
          v-else-if="!isOrderModified && isEditable && needsInventoryUpdate && !canUpdateToPending"
          class="flex-1 flex items-center justify-center gap-1 btn bg-gray-400 text-white text-nowrap cursor-not-allowed"
          disabled
        >
          <IconParkOutlineCheckOne /> Actualizar a Pendiente
        </button>
      </div>
      <div class="flex justify-between gap-1" v-else>
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('rechazado')"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
        >
          <IcRoundArchive /> Rechazar pedido
        </button>
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('pendiente')"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          <IconParkOutlineCheckOne /> Aceptar pedido
        </button>
      </div>
      <div class="flex justify-between gap-1">
        <button
          v-if="!isOrderModified && isEditable"
          @click="sendConfirmationMessage"
          class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" />
          Resumen
        </button>
        <button
          v-if="!isOrderModified && isEditable"
          @click="sendEmptyMessage"
          class="flex-1 w-full flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" /> Vacío
        </button>
      </div>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import MiRemove from "~icons/mi/remove";
import LucideEdit from "~icons/lucide/edit";
import TablerPlus from "~icons/tabler/plus";
import TablerTrash from "~icons/tabler/trash";
import IconRefresh from "~icons/tabler/refresh";
import IcRoundArchive from "~icons/ic/round-archive";
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import MaterialSymbolsWarningRounded from "~icons/material-symbols/warning-rounded";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import { ToastEvents } from "~/interfaces";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);

const ordersStore = useOrdersStore();
const { getPendingOrders: pendingOrders, getOrders: orders, arePendingOrdersFetched } = storeToRefs(ordersStore);

productsStore.fetchData();

// ----- Define Vars -----
const submitting = ref(false);
const currentOrder = ref(null);
const currentOrderId = ref(null);
const editableOrder = ref([]);
const isOrderModified = ref(false);

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed -----
const autocompleteProducts = computed(() => {
  // Filter out the product that are in the modifiedOrder
  const productsIds = editableOrder.value.products.map((p) => p.productId);
  const filteredProducts = products.value.filter((p) => !productsIds.includes(p.id));

  return filteredProducts.map((p) => {
    return {
      ...p,
      productNameWithUnit: `${p.productName} (${p.unit})`
    };
  });
});
const isEditable = computed(() => {
  return !["entregado", "cancelado", "rechazado"].includes(currentOrder.value.orderStatus);
});

const needsInventoryUpdate = computed(() => {
  return currentOrder.value && currentOrder.value.orderStatus === "requiere-actualizacion-inventario";
});

const productsNeedingStock = computed(() => {
  if (!currentOrder.value || !currentOrder.value.products) return [];

  return currentOrder.value.products.filter((product) => {
    const quantity = parseFloat(product.quantity || 0);
    const stockUsed = parseFloat(product.stockUsed || 0);
    return quantity > stockUsed;
  });
});

// Update the canUpdateToPending computed property
const canUpdateToPending = computed(() => {
  if (!needsInventoryUpdate.value || !currentOrder.value || !currentOrder.value.products) return false;

  // Make sure we have the latest product data
  const upToDateProducts = products.value;

  // Check if all products have enough stock now
  return currentOrder.value.products.every((product) => {
    // Get the quantity ordered and how much stock we've already allocated
    const quantity = parseFloat(product.quantity || 0);
    const stockUsed = parseFloat(product.stockUsed || 0);

    // Find the product in the products store to get current stock
    const productInStore = upToDateProducts.find((p) => p.id === product.productId);

    // If product not found in store, it can't be updated
    if (!productInStore) return false;

    // Get the current available stock
    const currentStockAvailable = parseFloat(productInStore.productStock || 0);

    // For products already fully accounted for
    if (quantity <= stockUsed) return true;

    // For products needing more stock
    const additionalNeeded = quantity - stockUsed;

    // Log for debugging if needed
    console.debug(
      `Product ${product.productName}: needs ${additionalNeeded} more, current stock ${currentStockAvailable}`
    );

    return currentStockAvailable >= additionalNeeded;
  });
});

// ----- Define Methods -----

// Add a method to refresh product data
async function refreshProductData() {
  try {
    // This will update the store with fresh data from the database
    const forceUpdate = true;
    await productsStore.fetchData(forceUpdate);

    // Check if we can now update to pending status
    if (needsInventoryUpdate.value && canUpdateToPending.value) {
      useToast(ToastEvents.success, "¡Hay stock suficiente para actualizar el pedido!");
    }
  } catch (error) {
    console.error("Error refreshing product data:", error);
    useToast(ToastEvents.error, "Error al actualizar la información de inventario");
  }
}

// Helper function to determine if a specific product needs more stock
function productNeedsMoreStock(product) {
  const quantity = parseFloat(product.quantity || 0);
  const stockUsed = parseFloat(product.stockUsed || 0);
  return quantity > stockUsed;
}
// Add these helper methods to your script setup
function getCurrentInventoryStock(productId) {
  const productInStore = products.value.find((p) => p.id === productId);
  return productInStore ? parseFloat(productInStore.productStock || 0) : 0;
}

function canCoverProduct(product) {
  const currentStock = getCurrentInventoryStock(product.productId);
  const stockNeeded = parseFloat(product.quantity || 0) - parseFloat(product.stockUsed || 0);
  return currentStock >= stockNeeded;
}

async function updateStatus(status) {
  // Check the valid status
  if (!ORDER_STATUS_OPTIONS.includes(status)) {
    useToast(ToastEvents.error, "El estado seleccionado no es válido, por favor intenta nuevamente");
    return;
  }

  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Update the order
  const orderUpdated = await ordersStore.updateStatusOrder(currentOrder.value.id, status);

  if (orderUpdated) {
    useToast(ToastEvents.success, `Pedido marcado como "${status}" correctamente`);
    mainModal.value.closeModal();
    submitting.value = false;
  } else {
    useToast(
      ToastEvents.error,
      `Hubo un error marcar el pedido como "${status}" el pedido, por favor intenta nuevamente`
    );
    submitting.value = false;
  }
}

function sendConfirmationMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = currentOrder.value.client.phone.replace(/\D/g, "");

  // Message creation
  const message = createMessage(
    currentOrder.value.products,
    currentOrder.value.client,
    currentOrder.value.shippingPrice,
    currentOrder.value.totalAmount
  );

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

function sendEmptyMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = currentOrder.value.client.phone.replace(/\D/g, "");

  // Message creation
  const message = "";

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

// ----- Define Methods -------
function manageProduct(productId, action) {
  // Find index of the product
  const productIndex = editableOrder.value.products.findIndex((p) => p.productId === productId);

  // Find product in products
  const productFullInfo = products.value.find((p) => p.id === productId);
  const productStep = productFullInfo.step ?? 0.5;

  // Edit product by reference
  const product = editableOrder.value.products[productIndex];

  if (action === "add") {
    // Add quantity
    product.quantity = product.quantity + productStep;
    product.total = product.price * product.quantity;

    // Update total
    updateOrderFinancial();
    return;
  }

  // If it's the last product, remove it and unselect it
  if (product.quantity <= productStep) {
    // Remove product from the list using the index
    editableOrder.value.products.splice(productIndex, 1);
  }

  // Manage remove action
  product.quantity = product.quantity - productStep;
  product.total = product.price * product.quantity;
  updateOrderFinancial();
}

function addProduct(productId) {
  // Get product properties
  const product = products.value.find((p) => p.id === productId);

  // Check if product exists
  if (!product) {
    useToast("error", "El producto no existe, por favor intenta nuevamente.");
    return;
  }

  // Check if product is already in the list
  if (editableOrder.value.products.find((p) => p.productId === product.id)) {
    useToast("error", "El producto ya ha sido agregado, por favor intenta nuevamente.");
    return;
  }

  // Add product to the list
  editableOrder.value.products.push({
    productId: product.id,
    productName: product.productName,
    price: product.price,
    quantity: product.step ?? 0.5,
    total: product.price * (product.step ?? 0.5),
    unit: product.unit
  });

  // Update the total amount
  updateOrderFinancial();
}

function updateOrderFinancial() {
  // Update the total products amount
  editableOrder.value.totalProductsAmount = editableOrder.value.products.reduce((acc, product) => {
    return acc + product.total;
  }, 0);

  // Update the total amount
  editableOrder.value.totalAmount = editableOrder.value.totalProductsAmount + editableOrder.value.shippingPrice;
}

const showModal = (orderId) => {
  // Check pending orders are fetched
  if (!arePendingOrdersFetched.value) {
    useToast("error", "Parece que los pedidos no han sido cargados aún, por favor intenta nuevamente.");
    return;
  }

  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // Based on the orderId, we will get the sell data and fill the form
  const order = [...pendingOrders.value, ...orders.value].find((o) => o.id === orderId);

  // Check if order exists
  if (!order) {
    useToast("error", "Parece que la venta no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current order
  currentOrder.value = order;
  currentOrderId.value = orderId;

  // This is the only way to make it work, otherwise it will be a reference since there are many nested objects
  editableOrder.value = JSON.parse(JSON.stringify(order));

  // Show modal
  mainModal.value.showModal();
};

async function modifyOrder() {
  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Validate the editableOrder has products
  if (editableOrder.value.products.length === 0) {
    useToast(ToastEvents.error, "El pedido debe tener al menos un producto, por favor intenta nuevamente");
    submitting.value = false;
    return;
  }

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Update the order
  const orderUpdated = await ordersStore.updatePendingOrder(editableOrder.value, currentOrder.value);

  if (orderUpdated) {
    useToast(ToastEvents.success, "Pedido modificado correctamente");
    mainModal.value.closeModal();
    // Show the updated order
    showModal(currentOrderId.value);
    submitting.value = false;
  } else {
    useToast(ToastEvents.error, "Hubo un error al modificar el pedido, por favor intenta nuevamente");
    submitting.value = false;
  }
}

function getCurrentProductCost(productId) {
  const product = products.value.find((p) => p.id === productId);
  return formatPrice(product ? parseFloat(product.cost || 0) : 0);
}

// ----- Define Hooks -----

// ----- Define Watchers -----
watch(
  [currentOrder, editableOrder],
  (newValues) => {
    isOrderModified.value = JSON.stringify(newValues[0]) !== JSON.stringify(newValues[1]);
  },
  { deep: true }
);

watch(() => editableOrder.value.shippingPrice, updateOrderFinancial);

// ----- Define Expose -----
defineExpose({ showModal });
</script>

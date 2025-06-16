<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col w-full">
          <span class="font-semibold text-xl">Cargar Remito de Proveedor</span>
          <span class="text-gray-500">Registra compras de múltiples productos de un proveedor</span>
        </div>
      </div>
    </template>

    <template #default>
      <FormKit
        type="form"
        id="remito-form"
        :form-class="`flex flex-col gap-4 w-full`"
        @submit="saveRemito"
        :actions="false"
      >
        <!-- Step 1: Supplier Selection -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="font-medium text-gray-700 mb-3">Seleccionar Proveedor</h3>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Proveedor</label>
            <div class="relative">
              <input
                type="text"
                v-model="form.supplierName"
                @input="onSupplierInput"
                @focus="showSupplierDropdown = true"
                @blur="onSupplierBlur"
                class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full"
                placeholder="Nombre del proveedor"
              />

              <!-- Dropdown for supplier autocomplete -->
              <div
                v-if="showSupplierDropdown && filteredSuppliers.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <div
                  v-for="supplier in filteredSuppliers"
                  :key="supplier.id"
                  @mousedown="selectSupplier(supplier)"
                  class="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {{ supplier.name }}
                </div>
              </div>

              <!-- Option to create new supplier if not found -->
              <div
                v-if="showSupplierDropdown && form.supplierName && filteredSuppliers.length === 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
              >
                <div
                  @mousedown="createAndSelectSupplier"
                  class="px-3 py-2 hover:bg-green-100 cursor-pointer text-green-600"
                >
                  + Crear proveedor "{{ form.supplierName }}"
                </div>
              </div>
            </div>
          </div>

          <div v-if="form.supplierId" class="mt-3 p-2 bg-blue-50 rounded-md">
            <div class="flex items-center gap-2 text-blue-800">
              <LucideCheckCircle class="text-blue-600" />
              <span
                >Proveedor seleccionado: <b>{{ form.supplierName }}</b></span
              >
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-4">
            <label class="text-sm font-medium">Número de Remito (opcional)</label>
            <input
              type="text"
              v-model="form.remitoNumber"
              class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: 0001-00045678"
            />
          </div>

          <div class="flex flex-col gap-2 mt-4">
            <label class="text-sm font-medium">Fecha del Remito</label>
            <input
              type="date"
              v-model="form.remitoDate"
              class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              :max="today"
            />
          </div>
        </div>

        <!-- Step 2: Product Selection (only shown after supplier is selected) -->
        <div class="border border-gray-200 rounded-lg p-4" v-if="form.supplierId">
          <div class="flex justify-between items-center">
            <h3 class="font-medium text-gray-700 mb-3">Productos del Remito</h3>
            <button
              type="button"
              @click="showProductSelector = true"
              class="btn-sm bg-primary text-white flex items-center gap-1"
              :disabled="!form.supplierId"
            >
              <TablerPlus class="text-sm" /> Añadir Producto
            </button>
          </div>

          <!-- Product selector overlay -->
          <div
            v-if="showProductSelector"
            class="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center"
          >
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-lg">Seleccionar Productos</h3>
                <button type="button" @click="showProductSelector = false" class="text-gray-500 hover:text-gray-700">
                  <IconoirCancel />
                </button>
              </div>

              <!-- Search bar -->
              <div class="relative mb-4">
                <input
                  type="text"
                  v-model="productSearch"
                  placeholder="Buscar productos..."
                  class="w-full border rounded-md !pl-10 !py-2 !pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <AntDesignSearchOutlined class="absolute left-3 top-3 text-gray-400" />
              </div>

              <!-- Product list -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  @click="selectProduct(product)"
                  class="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                  :class="{ 'border-primary': isProductSelected(product.id) }"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-12 h-12 flex-shrink-0 bg-gray-100 rounded"
                      :style="
                        product.imageUrl ? `background-image: url(${product.imageUrl}); background-size: cover;` : ''
                      "
                    ></div>
                    <div class="flex-1">
                      <div class="font-medium">{{ product.productName }}</div>
                      <div class="text-xs text-gray-500">
                        Stock actual: {{ formatQuantity(product.productStock) }} {{ product.unit }}
                      </div>
                    </div>
                    <div v-if="isProductSelected(product.id)" class="text-primary">
                      <LucideCheckCircle />
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex justify-end gap-2">
                <button type="button" @click="showProductSelector = false" class="btn bg-secondary">Cancelar</button>
                <button
                  type="button"
                  @click="confirmProductSelection"
                  class="btn bg-primary text-white"
                  :disabled="!hasSelectedNewProducts"
                >
                  Añadir Seleccionados
                </button>
              </div>
            </div>
          </div>

          <!-- Added products table -->
          <div v-if="form.products.length > 0" class="mt-4 overflow-x-auto">
            <div class="block lg:hidden">
              <!-- Mobile view: Card-based layout -->
              <div
                v-for="(product, index) in form.products"
                :key="product.id"
                class="mb-4 border rounded-lg p-3 bg-white"
              >
                <div class="flex justify-between items-center mb-3">
                  <div>
                    <div class="font-medium">{{ product.name }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </div>
                  <button type="button" @click="removeProduct(index)" class="text-red-500 hover:text-red-700">
                    <TablerTrash class="text-lg" />
                  </button>
                </div>

                <!-- Input fields -->
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="text-xs font-medium text-gray-500 mb-1 block">Cantidad</label>
                    <input
                      type="number"
                      v-model="product.quantity"
                      class="border rounded w-full !px-2 !py-2"
                      @input="calculateProductTotal(product)"
                      step="any"
                      min="0"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-500 mb-1 block">Costo Unitario</label>
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        v-model="product.unitCost"
                        class="border rounded w-full !pl-6 !px-2 !py-2"
                        @input="calculateProductTotal(product)"
                        step="any"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Statistics card -->
                <div class="bg-blue-50 rounded p-3 border border-blue-100">
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div class="flex flex-col">
                      <span class="text-xs text-blue-600">Stock actual</span>
                      <span class="font-medium">{{ formatQuantity(product.currentStock) }} {{ product.unit }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs text-blue-600">Nuevo stock</span>
                      <span class="font-medium"
                        >{{ formatQuantity(product.currentStock + product.quantity) }} {{ product.unit }}</span
                      >
                      <span class="text-xs mt-1 text-green-600">+{{ formatQuantity(product.quantity) }}</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div class="flex flex-col">
                      <span class="text-xs text-blue-600">Costo actual</span>
                      <span class="font-medium">{{ formatPrice(product.currentCost) }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs text-blue-600">Nuevo costo</span>
                      <span class="font-medium">{{ formatPrice(calculateNewCost(product)) }}</span>
                      <span
                        class="text-xs mt-1"
                        :class="
                          calculateNewCost(product) - product.currentCost >= 0 ? 'text-green-600' : 'text-red-600'
                        "
                      >
                        {{ calculateNewCost(product) - product.currentCost >= 0 ? "+" : "" }}
                        {{ formatPrice(calculateNewCost(product) - product.currentCost) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-blue-100">
                    <span class="text-sm text-blue-600 font-medium">Total:</span>
                    <span class="font-semibold">{{ formatPrice(product.total) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop view: Table layout -->
            <table class="min-w-full divide-y divide-gray-200 hidden lg:table">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unitario
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th class="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(product, index) in form.products" :key="product.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2">
                    <div class="font-medium">{{ product.name }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </td>
                  <td class="px-4 py-2">
                    <input
                      type="number"
                      v-model="product.quantity"
                      class="border rounded w-20 !px-2 !py-1"
                      @input="calculateProductTotal(product)"
                      step="any"
                      min="0"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        v-model="product.unitCost"
                        class="border rounded w-32 !pl-8 !px-2 !py-1"
                        @input="calculateProductTotal(product)"
                        step="any"
                        min="0"
                      />
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div class="flex flex-col">
                      <div class="flex items-baseline gap-1">
                        <span class="font-medium">{{ formatQuantity(product.currentStock + product.quantity) }}</span>
                        <span class="text-xs text-green-600">+{{ formatQuantity(product.quantity) }}</span>
                      </div>
                      <div class="text-xs text-gray-500">Actual: {{ formatQuantity(product.currentStock) }}</div>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div class="flex flex-col">
                      <div class="font-medium">{{ formatPrice(calculateNewCost(product)) }}</div>
                      <div
                        class="text-xs"
                        :class="
                          calculateNewCost(product) - product.currentCost >= 0 ? 'text-green-600' : 'text-red-600'
                        "
                      >
                        {{ calculateNewCost(product) - product.currentCost >= 0 ? "+" : "" }}
                        {{ formatPrice(calculateNewCost(product) - product.currentCost) }}
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 font-medium">{{ formatPrice(product.total) }}</td>
                  <td class="px-4 py-2">
                    <button type="button" @click="removeProduct(index)" class="text-red-500 hover:text-red-700">
                      <TablerTrash class="text-sm" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary and Notes -->
        <div class="border border-gray-200 rounded-lg p-4" v-if="form.products.length > 0">
          <h3 class="font-medium text-gray-700 mb-3">Resumen del Remito</h3>

          <div class="flex justify-between items-center border-b pb-2">
            <span class="font-medium">Total Productos:</span>
            <span class="font-medium">{{ form.products.length }}</span>
          </div>

          <div class="flex justify-between items-center border-b py-2">
            <span class="font-medium">Total Unidades:</span>
            <span class="font-medium">{{ calculateTotalQuantity() }}</span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="font-medium">Total Remito:</span>
            <span class="font-semibold text-lg">{{ formatPrice(calculateTotalCost()) }}</span>
          </div>

          <div class="mt-4">
            <label class="text-sm font-medium">Notas adicionales</label>
            <textarea
              v-model="form.notes"
              class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full mt-1"
              placeholder="Detalles adicionales sobre este remito"
              rows="2"
            ></textarea>
          </div>
        </div>
      </FormKit>
    </template>

    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          type="button"
          @click="mainModal.closeModal()"
          class="flex-1 btn bg-white border border-gray-300 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="saveRemito"
          class="flex-1 btn bg-primary text-white hover:bg-primary/90"
          :class="{ 'opacity-50 pointer-events-none': submitting || !isFormValid }"
        >
          <span v-if="submitting">Guardando...</span>
          <span v-else>Registrar Remito</span>
        </button>
      </div>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import { ToastEvents, StockMovementType } from "~/interfaces";
import TablerPlus from "~icons/tabler/plus";
import TablerTrash from "~icons/tabler/trash";
import LucideCheckCircle from "~icons/lucide/check-circle";
import IconoirCancel from "~icons/iconoir/cancel";
import AntDesignSearchOutlined from "~icons/ant-design/search-outlined";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { getProducts: products, areProductsFetched, getSuppliers: suppliers } = storeToRefs(productsStore);

// ----- Define Vars -----
const submitting = ref(false);
const showSupplierDropdown = ref(false);
const showProductSelector = ref(false);
const filteredSuppliers = ref([]);
const productSearch = ref("");
const selectedProductIds = ref([]);
const { $dayjs } = useNuxtApp();
const today = ref($dayjs().format("YYYY-MM-DD"));

const form = ref({
  supplierName: "",
  supplierId: null,
  remitoNumber: "",
  remitoDate: $dayjs().format("YYYY-MM-DD"),
  products: [],
  notes: ""
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed Properties -----
const filteredProducts = computed(() => {
  if (!productSearch.value.trim()) {
    return products.value.filter((p) => p.isAvailable);
  }

  const search = productSearch.value.toLowerCase();
  return products.value.filter(
    (p) =>
      p.isAvailable &&
      (p.productName.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search)))
  );
});

const isFormValid = computed(() => {
  return (
    form.value.supplierId &&
    form.value.products.length > 0 &&
    form.value.products.every((p) => p.quantity > 0 && p.unitCost > 0) &&
    form.value.remitoDate
  );
});

const hasSelectedNewProducts = computed(() => {
  return selectedProductIds.value.some((id) => !form.value.products.find((p) => p.id === id));
});

// ----- Define Methods -----
function onSupplierInput() {
  if (form.value.supplierName.trim() === "") {
    filteredSuppliers.value = [];
    form.value.supplierId = null;
    showSupplierDropdown.value = false;
    return;
  }

  const searchTerm = form.value.supplierName.toLowerCase();
  filteredSuppliers.value = suppliers.value.filter((supplier) => supplier.name.toLowerCase().includes(searchTerm));
  showSupplierDropdown.value = true;
}

function onSupplierBlur() {
  // Delay hiding the dropdown to allow click events to register
  setTimeout(() => {
    showSupplierDropdown.value = false;
  }, 200);
}

function selectSupplier(supplier) {
  form.value.supplierName = supplier.name;
  form.value.supplierId = supplier.id;
  showSupplierDropdown.value = false;
}

async function createAndSelectSupplier() {
  if (!form.value.supplierName.trim()) return;

  try {
    const newSupplier = await productsStore.addSupplier(form.value.supplierName);
    if (newSupplier) {
      selectSupplier(newSupplier);
    } else {
      useToast(ToastEvents.error, "Error al crear el proveedor");
    }
  } catch (error) {
    console.error("Error creating supplier:", error);
    useToast(ToastEvents.error, "Error al crear el proveedor");
  }
}

function isProductSelected(productId) {
  return selectedProductIds.value.includes(productId);
}

function selectProduct(product) {
  const index = selectedProductIds.value.indexOf(product.id);
  if (index === -1) {
    selectedProductIds.value.push(product.id);
  } else {
    selectedProductIds.value.splice(index, 1);
  }
}

function confirmProductSelection() {
  // Get newly selected products
  const newSelectedIds = selectedProductIds.value.filter((id) => !form.value.products.find((p) => p.id === id));

  // Add new products to form
  newSelectedIds.forEach((id) => {
    const product = products.value.find((p) => p.id === id);
    if (product) {
      form.value.products.push({
        id: product.id,
        name: product.productName,
        unit: product.unit,
        currentStock: parseFloat(product.productStock || 0),
        currentCost: parseFloat(product.cost || 0),
        quantity: 1, // Default quantity
        unitCost: parseFloat(product.cost || 0), // Default to current cost
        total: parseFloat(product.cost || 0) // Default total
      });
    }
  });

  showProductSelector = false;
}

function calculateProductTotal(product) {
  product.quantity = parseFloat(product.quantity) || 0;
  product.unitCost = parseFloat(product.unitCost) || 0;
  product.total = product.quantity * product.unitCost;
}

function calculateNewCost(product) {
  // Calculate weighted average cost
  const currentStock = parseFloat(product.currentStock) || 0;
  const currentCost = parseFloat(product.currentCost) || 0;
  const addedQuantity = parseFloat(product.quantity) || 0;
  const addedCost = parseFloat(product.unitCost) || 0;

  if (currentStock === 0 && addedQuantity === 0) {
    return currentCost;
  }

  if (addedQuantity === 0) {
    return currentCost;
  }

  // Calculate weighted average
  const currentValue = currentStock * currentCost;
  const addedValue = addedQuantity * addedCost;
  const newStock = currentStock + addedQuantity;

  return (currentValue + addedValue) / newStock;
}

function removeProduct(index) {
  // Remove from selected product IDs
  const productId = form.value.products[index].id;
  const idIndex = selectedProductIds.value.indexOf(productId);
  if (idIndex !== -1) {
    selectedProductIds.value.splice(idIndex, 1);
  }

  // Remove from form products
  form.value.products.splice(index, 1);
}

function calculateTotalQuantity() {
  return form.value.products.reduce((sum, product) => sum + parseFloat(product.quantity || 0), 0);
}

function calculateTotalCost() {
  return form.value.products.reduce((sum, product) => sum + (product.total || 0), 0);
}

async function saveRemito() {
  if (submitting.value || !isFormValid.value) {
    return;
  }

  submitting.value = true;

  try {
    // Confirm dialogue
    const confirmed = await confirmDialogue.value.openDialog({
      edit: true,
      message: `¿Está seguro de registrar este remito con ${
        form.value.products.length
      } productos por un total de ${formatPrice(calculateTotalCost())}?`
    });

    if (!confirmed) {
      submitting.value = false;
      return;
    }

    // Generate a unique remito reference ID
    const remitoReference = `remito-${Date.now()}`;

    // Process each product and update inventory
    let allSuccessful = true;
    let updatedProducts = 0;

    // Create common notes with remito information
    const commonNotes = `Remito${form.value.remitoNumber ? " #" + form.value.remitoNumber : ""} ${
      form.value.notes ? "- " + form.value.notes : ""
    }`;

    // Process products sequentially to avoid race conditions
    for (const product of form.value.products) {
      // Find the full product information
      const fullProduct = products.value.find((p) => p.id === product.id);
      if (!fullProduct) continue;

      // Calculate new stock level and cost
      const previousStock = parseFloat(fullProduct.productStock || 0);
      const addedQuantity = parseFloat(product.quantity || 0);
      const newStock = previousStock + addedQuantity;

      // Calculate weighted average cost
      const currentValue = previousStock * parseFloat(fullProduct.cost || 0);
      const addedValue = addedQuantity * parseFloat(product.unitCost || 0);
      const newCost = (currentValue + addedValue) / newStock;

      // Prepare stock update data
      const stockUpdate = {
        productStock: newStock,
        cost: newCost
      };

      // Prepare movement details
      const movementDetails = {
        type: StockMovementType.ADDITION,
        supplierId: form.value.supplierId,
        supplierName: form.value.supplierName,
        unitBuyingPrice: parseFloat(product.unitCost || 0),
        notes: commonNotes,
        remitoReference: remitoReference,
        remitoDate: form.value.remitoDate
      };

      // Update product stock
      const updated = await productsStore.updateStockWithMovement(stockUpdate, fullProduct, movementDetails);

      if (!updated) {
        allSuccessful = false;
        break;
      }

      updatedProducts++;
    }

    if (allSuccessful) {
      useToast(ToastEvents.success, `Remito registrado correctamente con ${updatedProducts} productos`);
      resetForm();
      mainModal.value.closeModal();
    } else {
      useToast(ToastEvents.error, "Error al registrar algunos productos del remito");
    }
  } catch (error) {
    console.error("Error saving remito:", error);
    useToast(ToastEvents.error, "Error al guardar el remito");
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  form.value = {
    supplierName: "",
    supplierId: null,
    remitoNumber: "",
    remitoDate: $dayjs().format("YYYY-MM-DD"),
    products: [],
    notes: ""
  };
  selectedProductIds.value = [];
  showProductSelector.value = false;
}

async function fetchSuppliers() {
  if (!productsStore.areSuppliersFetched) {
    await productsStore.fetchSuppliers();
  }
}

// Method to show the modal
const showModal = async () => {
  // Make sure products and suppliers are fetched
  if (!areProductsFetched.value) {
    await productsStore.fetchData();
  }

  await fetchSuppliers();

  // Reset form and show modal
  resetForm();

  if (mainModal.value) {
    mainModal.value.showModal();
  }
};

// ----- Define Hooks -----
onMounted(async () => {
  // Load suppliers when component mounts
  await fetchSuppliers();
});

// ----- Define Expose -----
defineExpose({ showModal });
</script>

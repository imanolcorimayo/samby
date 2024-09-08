<template>
  <FormKit
    type="form"
    id="productos-nuevo"
    :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
    submit-label="Nuevo Producto"
    @submit="submitHandler"
    :actions="false"
  >
    <div class="flex flex-col gap-0">
      <h1 class="text-start">Nuevo producto</h1>
      <p class="text-gray-600">Los productos cargados van a listarse para ser usados a la hora de cargar ventas</p>
    </div>
    <FormKit
      type="text"
      name="product_name"
      input-class="w-full"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      label="Nombre del producto"
      placeholder="Ej: Manzana"
      validation="required|length:4"
      v-model="form.productName"
    />
    <FormKit
      type="textarea"
      name="product_description"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Detalles (opcional)"
      placeholder="Ej: Manzanas provenientes de Chile, proveedor del sur, etc."
      validation="length:4"
      v-model="form.description"
    />
    <div class="flex justify-between items-end gap-4">
      <FormKit
        type="select"
        name="product_unit"
        :options="['Kg', 'Unitario', 'Bolsa', 'Cajon', 'Gramo', 'Litro', 'Docena']"
        label-class="font-medium"
        messages-class="text-red-500 text-[0.75rem]"
        input-class="w-full"
        outer-class="w-full flex-1"
        label="Unidad de medida"
        placeholder="Ej: Kg"
        validation="required"
        v-model="form.unit"
      />
      <FormKit
        type="select"
        name="unit_step"
        :options="[0.25, 0.5, 1]"
        label-class="font-medium"
        messages-class="text-red-500 text-[0.75rem]"
        input-class="w-full"
        outer-class="w-full flex-1"
        label="Paso de unidad de medida"
        placeholder="Ej: 0.5"
        validation="required"
        v-model="form.step"
      />
    </div>
    <FormKit
      type="number"
      name="price"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Precio de venta por unidad"
      placeholder="Ej: 7500"
      validation="required|numeric|min:1"
      v-model="form.price"
    />
    <div v-show="submitting" class="btn bg-primary text-white text-center">loading...</div>
    <FormKit
      v-show="!submitting"
      type="submit"
      label="Agregar"
      input-class="btn bg-primary text-white text-center w-full"
    />
  </FormKit>
  <div v-if="submitted" class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
    <div class="flex flex-col items-center gap-[1rem]">
      <IconParkOutlineCheckOne class="text-[3rem] text-success" />
      <span class="text-[2rem] font-semibold">¡Nuevo Producto Cargado!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] text-gray-600 text-center"
        >Ahora este producto va a ser listado a la hora de cargar una venta</span
      >
      <div class="flex flex-col gap-3">
        <button @click="submitted = false" class="btn bg-primary text-white">Agregar Otro Producto</button>
        <NuxtLink to="/ventas/nuevo" class="btn bg-primary text-white w-full text-center ring-1 ring-gray-300"
          >Nueva venta</NuxtLink
        >
        <NuxtLink to="/" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Menu</NuxtLink>
        <NuxtLink to="/productos" class="btn bg-secondary w-full text-center ring-1 ring-gray-300"
          >Ver productos</NuxtLink
        >
      </div>
    </div>
  </div>
  <Loader v-if="submitting" />
</template>

<script setup>
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();

// ----- Define Vars -------
const submitted = ref(false);
const submitting = ref(false);
const form = ref({
  productName: "",
  description: "",
  unit: "Kg",
  step: 0.5,
  price: 0
});

// ----- Define Methods -------
async function submitHandler() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Add the product to the store
  await productsStore.addProduct({ ...form.value });

  // Clean values
  form.value = {
    productName: "",
    description: "",
    unit: "Kg",
    step: 0.5,
    price: 0
  };

  submitted.value = true;
  submitting.value = false;
}

useHead({
  title: "Nueva producto"
});
</script>

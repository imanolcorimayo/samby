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
      <h1 class="text-start">Nueva compra de productos</h1>
      <p class="text-gray-600">Manejo de stock</p>
    </div>
    <FormKit
      type="text"
      name="product_name"
      input-class="w-full"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      label="Nombre del producto"
      placeholder="Escribi el nombre del producto"
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
      placeholder="Ej: ...estaba en oferta por estacion, etc."
      validation="length:4"
      v-model="form.description"
    />
    <FormKit
      type="number"
      name="product_quantity"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Cantidad"
      placeholder="Agrega la cantidad de productos comprados"
      validation="required|min:1"
      v-model="form.quantity"
    />
    <FormKit
      type="number"
      name="product_price"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Precio Total"
      placeholder="$$$"
      validation="required"
      v-model="form.price"
    />
    <FormKit
      type="date"
      name="product_date"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Fecha"
      placeholder="yyyy-mm-dd"
      validation="required"
      v-model="form.date"
    />
    <div v-if="submitting" class="btn bg-primary text-white text-center">loading...</div>
    <FormKit v-else type="submit" label="Agregar" outer-class="btn bg-primary text-white text-center" />
  </FormKit>
  <div v-if="submitted" class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
    <div class="flex flex-col items-center gap-[1rem]">
      <IconParkOutlineCheckOne class="text-[3rem] text-success" />
      <span class="text-[2rem] font-semibold">¡Compra Cargada!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] text-gray-600 text-center">Tu compra se proceso correctamente</span>
      <div class="flex flex-col gap-3">
        <button @click="submitted = false" class="btn bg-primary text-white">Agregar Nuevo Producto</button>
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Vars -------
const submitted = ref(false);
const submitting = ref(false);
const form = ref({
  productName: "",
  description: "",
  price: "",
  date: "",
  quantity: 0
});

// ----- Define Methods -------
async function submitHandler() {
  // If submitting, return
  if (submitting.value) return;

  // Set submitting to avoid having multiple requests
  submitting.value = true;

  // Get Firestore and Current User
  const db = useFirestore();
  const user = useCurrentUser();

  // Handle recurrent payments
  const newBuying = await addDoc(collection(db, "producto"), {
    ...form.value,
    createdAt: serverTimestamp(),
    userUid: user.value.uid
  });

  // the way to access to the buying id if needed: newBuying.id;

  // Clean values
  form.value = {
    productName: "",
    description: "",
    price: "",
    quantity: 0,
    date: ""
  };

  submitted.value = true;
  submitting.value = false;
}

useHead({
  title: "Nueva producto"
});
</script>

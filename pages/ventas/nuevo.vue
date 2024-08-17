<template>
  <FormKit
    type="form"
    id="ventas-nuevo"
    :form-class="`flex flex-col gap-[1rem] w-full ${submitted ? 'hidden' : ''}`"
    submit-label="Register"
    @submit="submitHandler"
    :actions="false"
    #default="{ value }"
  >
    <div class="flex flex-col gap-0">
      <h1 class="text-2xl font-bold">Nueva venta</h1>
      <p class="text-gray-600">Mensaje de aclaracion</p>
    </div>
    <FormKit
      type="text"
      name="sell_name"
      input-class="w-full"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      label="Titulo de la venta"
      placeholder="Escribi un titulo para la venta"
      validation="required|length:4"
      v-model="form.sellName"
    />
    <FormKit
      type="textarea"
      name="sell_description"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Detalles de la venta"
      placeholder="Ej: ...reparto a domicilio, etc."
      validation="required|length:4"
      v-model="form.description"
    />
    <FormKit
      type="number"
      name="sell_price"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Precio de venta"
      placeholder="$$$"
      validation="required"
      v-model="form.price"
    />
    <FormKit
      type="date"
      name="sell_date"
      label-class="font-medium"
      messages-class="text-red-500 text-[0.75rem]"
      input-class="w-full"
      label="Fecha de venta"
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
      <span class="text-[2rem] font-semibold">¡Venta Cargada!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[16px] text-gray-600 text-center">Tu venta se proceso correctamente</span>
      <div class="flex flex-col gap-3">
        <button @click="submitted = false" class="btn bg-primary text-white">Agregar Nuevo</button>
        <NuxtLink to="/" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Menu</NuxtLink>
        <NuxtLink to="/ventas" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Ver ventas</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Vars -------
const submitted = ref(false);
const submitting = ref(false);
const form = ref({
  sellName: "",
  description: "",
  price: "",
  date: ""
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
  const newSell = await addDoc(collection(db, "venta"), {
    ...form.value,
    createdAt: serverTimestamp(),
    userUid: user.value.uid
  });

  // the way to access to the sell id if needed: newSell.id;

  // Clean values
  form.value = {
    sellName: "",
    description: "",
    price: "",
    date: ""
  };

  submitted.value = true;
  submitting.value = false;
}

useHead({
  title: "Nueva venta"
});
</script>

<template>
  <div class="flex flex-col gap-[2rem] w-full">
    <EmployeeNewAndUpdate ref="newOrUpdateEmployee" />
    <div class="flex justify-between items-start">
      <div class="flex flex-col items-start">
        <h1 class="text-start font-semibold">Empleados</h1>
        <span class="text-gray-500"
          >Administra quien puede ver los pedidos de tu negocio y acceder a los contactos de tus clientes</span
        >
      </div>
      <button
        @click="newOrUpdateEmployee.showModal()"
        class="btn bg-primary text-white flex items-center text-nowrap h-fit"
      >
        <IcRoundPlus class="text-[1.143rem]" /> Nuevo
      </button>
    </div>
    <div class="flex flex-col gap-[1rem]">
      <div class="flex flex-col gap-[0.571rem]" v-if="employees.length">
        <div
          class="flex flex-col gap-[0.571rem] p-[0.714rem] bg-secondary rounded-[0.428rem] shadow"
          v-for="(employee, index) in employees"
          :key="index"
        >
          <div class="flex justify-between items-center">
            <button
              class="flex-1 flex flex-col !bg-[unset]"
              @click="showEmployeeDetails(employee.id)"
              :disabled="employee.status.includes('Archivado')"
            >
              <span class="font-semibold">{{ employee.employeeName }}</span>
              <span class="text-sm">Teléfono: {{ employee.phone }}</span>
              <span class="text-sm"
                >Estado:
                <span
                  class="font-semibold"
                  :class="{
                    ['text-warning']: employee.status.includes('Pendiente'),
                    ['text-danger']: employee.status.includes('Archivado'),
                    ['text-success']: employee.status.includes('Activo')
                  }"
                  >{{ employee.status }}</span
                >
              </span>
            </button>
            <button
              class="flex flex-col justify-center items-center gap-1 text-xs"
              v-if="employee.status.includes('Pendiente')"
              @click="copyText(employee.code)"
            >
              <SolarCopyBold class="text-primary text-lg" />
              Codigo de Invitación
            </button>
          </div>
        </div>
      </div>
      <div class="flex" v-else-if="!areEmployeesFetched">Cargando empleados</div>
      <div class="flex" v-else>No hay empleados para el negocio seleccionado</div>
    </div>
  </div>
</template>

<script setup>
import { ToastEvents } from "~/interfaces";
import IcRoundPlus from "~icons/ic/round-plus";
import SolarCopyBold from "~icons/solar/copy-bold";

// ----- Define Pinia Vars --------
const indexStore = useIndexStore();
const { getEmployees: employees, areEmployeesFetched, areBusinessesFetched } = storeToRefs(indexStore);

if (!areBusinessesFetched.value) {
  // Wait 1 second when business are not fetched since this cleans up the employees
  setTimeout(() => {
    indexStore.fetchEmployees();
  }, 1000);
} else {
  indexStore.fetchEmployees();
}

// ----- Define Vars -----
// Refs
const newOrUpdateEmployee = ref(null);

// ----- Define Methods -----
function showEmployeeDetails(id) {
  // Check newOrUpdateEmployee is defined
  if (!newOrUpdateEmployee.value) return;

  newOrUpdateEmployee.value.showModal(id);
}

function copyText(text) {
  // Copy text to clipboard
  navigator.clipboard.writeText(text);

  // Show toast
  useToast(ToastEvents.success, "Codigo de invitación copiado, ahora puedes compartirlo con tu empleado");
}

useHead({
  title: "Lista de employeees"
});
</script>

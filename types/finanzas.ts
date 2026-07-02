export type FinanzasKpi = {
  ingresosMes: number
  ingresosAnio: number
  gastosMes: number
  gastosAnio: number
  beneficioMes: number
  beneficioAnio: number
  margenMes: number
  pendienteCobro: number
  pendienteGastos: number
  cobradoMes: number
}

export type SerieMensual = {
  mes: string
  ingresos: number
  gastos: number
  beneficio: number
}

export type TopFinanzas = {
  label: string
  total: number
  count: number
}

export type FinanzasDashboard = {
  kpi: FinanzasKpi
  serie: SerieMensual[]
  topClientes: TopFinanzas[]
  topGastos: TopFinanzas[]
  facturasPendientes: any[]
  gastosPendientes: any[]
}

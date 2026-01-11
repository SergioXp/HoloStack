# Plan de Implementación: Sistema de Presupuestos y Control de Gastos

## 🎯 Objetivo
Implementar un sistema completo para gestionar presupuestos de compras de cartas y registrar gastos de forma eficiente, con una interfaz tipo spreadsheet para entrada rápida de datos.

---

## 📊 Modelo de Datos

### Tabla: `budgets` (Presupuestos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT PK | UUID único |
| `name` | TEXT | Nombre del presupuesto |
| `type` | TEXT | `global` / `collection` |
| `collection_id` | TEXT FK | Referencia a colección (null si global) |
| `amount` | REAL | Cantidad del presupuesto en € |
| `period` | TEXT | `monthly` / `yearly` / `one-time` |
| `currency` | TEXT | `EUR` / `USD` (default EUR) |
| `start_date` | TEXT | Fecha de inicio del presupuesto (ISO) |
| `is_active` | BOOLEAN | Si está activo |
| `created_at` | INTEGER | Timestamp |
| `updated_at` | INTEGER | Timestamp |

### Tabla: `budget_groups` (Agrupación de presupuestos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT PK | UUID único |
| `parent_budget_id` | TEXT FK | Presupuesto padre (global) |
| `child_budget_id` | TEXT FK | Presupuesto hijo |

### Tabla: `expenses` (Registros de gastos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT PK | UUID único |
| `budget_id` | TEXT FK | Presupuesto al que pertenece |
| `date` | TEXT | Fecha de la compra (ISO) |
| `description` | TEXT | Descripción del artículo |
| `category` | TEXT | `single_card` / `sealed` / `etb` / `booster` / `accessory` / `other` |
| `amount` | REAL | Importe gastado |
| `currency` | TEXT | Moneda del gasto |
| `seller` | TEXT | Vendedor/tienda |
| `platform` | TEXT | `cardmarket` / `tcgplayer` / `ebay` / `tiktokshop` / `amazon` / `lgs` / `other` |
| `notes` | TEXT | Notas adicionales |
| `card_id` | TEXT FK | Referencia a carta (opcional) |
| `created_at` | INTEGER | Timestamp |

---

## 🖥️ Interfaces de Usuario

### 1. Página Principal de Presupuestos (`/budgets`)

**Header:**
- Título "Presupuestos y Gastos"
- Botón "Nuevo Presupuesto"
- Selector de período (mes/año actual)

**Dashboard Resumen:**
```
┌─────────────────────────────────────────────────────────────────┐
│  💰 Resumen del Mes                                             │
├─────────────────────────────────────────────────────────────────┤
│  Presupuesto Total: 150€     Gastado: 96,35€     Restante: 53,65€ │
│  ████████████████████░░░░░░░  64%                               │
└─────────────────────────────────────────────────────────────────┘
```

**Lista de Presupuestos:**
- Cards para cada presupuesto con:
  - Nombre y tipo (icono diferente si es global o de colección)
  - Barra de progreso
  - Gastado / Total
  - Período
  - Chip de estado (bajo control / cerca del límite / excedido)
  - Link a ver detalle

### 2. Detalle de Presupuesto (`/budgets/[id]`)

**Header:**
- Nombre del presupuesto
- Tipo y colección vinculada (si aplica)
- Botones: Editar, Eliminar

**Estadísticas:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Gastado    │  Restante    │   Operaciones│   Promedio   │
│    96,35€    │   53,65€     │      12      │    8,03€     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Tabla de Gastos (estilo spreadsheet):**
```
┌──────────┬────────────────────────┬──────────┬─────────┬────────────┬──────────┐
│  Fecha   │     Descripción        │ Categoría│ Importe │  Vendedor  │Plataforma│
├──────────┼────────────────────────┼──────────┼─────────┼────────────┼──────────┤
│10/01/2026│ ETB Fuegos Fantasmales │   ETB    │  59,00€ │     -      │TiktokShop│
│10/01/2026│ Pikachu VMAX #044      │  Single  │   2,35€ │  fulanito  │Cardmarket│
│08/01/2026│ Booster Bundle FF      │ Booster  │  35,00€ │     -      │ xxxx.com │
├──────────┼────────────────────────┼──────────┼─────────┼────────────┼──────────┤
│ [nueva]  │ [escribir...]          │  [sel.]  │   [0]   │ [opcional] │  [sel.]  │  ← Fila editable
└──────────┴────────────────────────┴──────────┴─────────┴────────────┴──────────┘
```

**Comportamiento de la tabla:**
- Tab: Avanza a siguiente columna
- Enter: Guarda la fila y crea una nueva
- Escape: Cancela edición
- Click en fila existente: Edición inline
- Doble click en celda: Edición directa
- Delete/Backspace con fila seleccionada: Confirmar eliminación

### 3. Modal de Creación/Edición de Presupuesto

```
┌─────────────────────────────────────────┐
│  ✨ Nuevo Presupuesto                    │
├─────────────────────────────────────────┤
│  Nombre: [___________________________]  │
│                                         │
│  Tipo:                                  │
│  ○ Global    ● Por Colección            │
│                                         │
│  Colección: [Mis Pikachus ▼]            │
│                                         │
│  Cantidad: [50] €                       │
│                                         │
│  Período:                               │
│  ● Mensual  ○ Anual  ○ Único            │
│                                         │
│  Incluir en presupuesto global:         │
│  [✓] Presupuesto Maestro (150€/mes)     │
│                                         │
│  [Cancelar]            [Crear]          │
└─────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/budgets` | Listar presupuestos |
| POST | `/api/budgets` | Crear presupuesto |
| GET | `/api/budgets/[id]` | Obtener presupuesto |
| PUT | `/api/budgets/[id]` | Actualizar presupuesto |
| DELETE | `/api/budgets/[id]` | Eliminar presupuesto |
| GET | `/api/budgets/[id]/expenses` | Listar gastos |
| POST | `/api/budgets/[id]/expenses` | Crear gasto |
| PUT | `/api/expenses/[id]` | Actualizar gasto |
| DELETE | `/api/expenses/[id]` | Eliminar gasto |
| GET | `/api/budgets/summary` | Resumen global |

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── budgets/
│   │   ├── page.tsx                    # Lista de presupuestos
│   │   ├── new/
│   │   │   └── page.tsx                # Crear presupuesto
│   │   └── [id]/
│   │       └── page.tsx                # Detalle + tabla de gastos
│   └── api/
│       ├── budgets/
│       │   ├── route.ts                # GET, POST
│       │   ├── summary/
│       │   │   └── route.ts            # Resumen global
│       │   └── [id]/
│       │       ├── route.ts            # GET, PUT, DELETE
│       │       └── expenses/
│       │           └── route.ts        # GET, POST gastos
│       └── expenses/
│           └── [id]/
│               └── route.ts            # PUT, DELETE gasto
├── components/
│   ├── BudgetCard.tsx                  # Card de presupuesto
│   ├── BudgetForm.tsx                  # Formulario crear/editar
│   ├── BudgetSummary.tsx               # Dashboard resumen
│   └── ExpenseTable.tsx                # Tabla spreadsheet de gastos
└── db/
    └── schema.ts                       # Añadir tablas budgets y expenses
```

---

## ⚡ Funcionalidades Adicionales Propuestas

### 1. **Gráficos de Gastos**
- Gráfico de barras: Gastos por mes
- Gráfico de donut: Distribución por categoría
- Línea de tendencia: Evolución mensual

### 2. **Alertas de Presupuesto**
- Indicador visual cuando se supera el 80%
- Badge de "Excedido" cuando se supera el 100%
- Opcional: Notificación al guardar gasto que excede

### 3. **Filtros en Tabla de Gastos**
- Por rango de fechas
- Por categoría
- Por plataforma
- Por rango de importe

### 4. **Exportación**
- Exportar a CSV
- Exportar a Excel

### 5. **Vinculación con Cartas**
- Al añadir gasto de "single", poder buscar y vincular la carta de la BD
- Ver imagen de la carta asociada en la tabla

### 6. **Recurrencia**
- Opción de marcar gastos como recurrentes (ej: suscripción a sorteos)

### 7. **Conversión de Moneda**
- Si el gasto está en USD, convertir automáticamente a EUR
- Mostrar siempre en la moneda del presupuesto

---

## 🎨 Diseño Premium

Siguiendo el estilo de la app:
- Fondos con gradientes slate-950 → purple/blue
- Cards con backdrop-blur y bordes slate-800
- Barras de progreso con gradientes según estado:
  - Verde (< 60%): emerald gradient
  - Amarillo (60-90%): amber gradient  
  - Rojo (> 90%): red gradient
- Tabla con estilo moderno, hover en filas
- Inputs inline con bordes sutiles
- Animaciones de guardado (checkmark verde)

---

## 🔄 Flujo de Trabajo del Usuario

1. **Crear presupuesto global** (ej: 150€/mes total)
2. **Crear presupuestos por colección** vinculados al global
3. **Registrar gastos** en la tabla inline
4. **Visualizar resumen** en dashboard
5. **Revisar histórico** por meses anteriores

---

## 📅 Plan de Implementación

### Fase 1: Base de Datos y API
- [ ] Añadir tablas al schema
- [ ] Migrar base de datos
- [ ] APIs CRUD para budgets
- [ ] APIs CRUD para expenses

### Fase 2: UI Básica
- [ ] Página de lista de presupuestos
- [ ] Formulario de creación
- [ ] Página de detalle

### Fase 3: Tabla Spreadsheet
- [ ] Componente ExpenseTable
- [ ] Navegación con Tab/Enter
- [ ] Guardado inline
- [ ] Edición de filas existentes

### Fase 4: Dashboard y Estadísticas
- [ ] Componente de resumen
- [ ] Gráficos con Recharts
- [ ] Filtros de período

### Fase 5: Polish
- [ ] Exportación CSV
- [ ] Alertas visuales
- [ ] Vinculación con cartas

---

## ✅ Criterios de Aceptación

1. Puedo crear presupuestos globales y por colección
2. Puedo agrupar presupuestos bajo uno global
3. Puedo añadir gastos escribiendo en fila y pulsando Tab/Enter
4. Veo el progreso del presupuesto en tiempo real
5. Puedo editar y eliminar gastos inline
6. Veo un resumen de todos mis presupuestos en el dashboard
7. La interfaz mantiene el estilo premium de la app

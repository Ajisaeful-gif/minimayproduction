import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { normalizeColourLabel } from "@/lib/colour-format";
import {
  cutting,
  cuttingRows,
  jenisKainMaster,
  kodePolaMaster,
  planCutting,
  planCuttingRows,
  planSewing,
  planSewingRows,
  profiles,
  racking,
  rackingRows,
  seri,
  seriEntries,
  skuMaster,
  supply,
  supplyRows
} from "@/db/schema";

function parseSequenceFromCode(kodeProduksi) {
  const matched = String(kodeProduksi ?? "").match(/(?:KPS|KPR)-?0*(\d{1,4})/i);

  return matched ? Number(matched[1]) : 0;
}

async function loadRows(table, foreignKey, parentId) {
  return db.select().from(table).where(eq(foreignKey, parentId));
}

export async function listPlanCuttingRecords() {
  const headers = await db.select().from(planCutting).orderBy(desc(planCutting.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const rows = await loadRows(planCuttingRows, planCuttingRows.planCuttingId, header.id);

      return {
        id: String(header.id),
        kodePc: header.kodePc,
        noPo: header.noPo,
        model: header.model,
        tanggal: header.tanggal,
        kodePola: header.kodePola ?? "",
        jenisKain: header.jenisKain ?? "",
        rows: rows.map((row) => ({
          sku: row.kodeSku,
          produk: row.namaProduk,
          model: row.model,
          size: row.size,
          colour: normalizeColourLabel(row.warna),
          qtyPlan: Number(row.qtyPlan ?? 0)
        }))
      };
    })
  );
}

export async function savePlanCuttingRecord(record, userId) {
  const [existing] = await db
    .select({ id: planCutting.id })
    .from(planCutting)
    .where(eq(planCutting.kodePc, record.kodePc))
    .limit(1);

  return db.transaction(async (tx) => {
    let headerId = existing?.id;
    const selectedColour = normalizeColourLabel(record.colour);
    const normalizedIncomingRows = Array.isArray(record.rows)
      ? record.rows.map((row) => ({
          sku: row.sku,
          produk: row.produk,
          model: row.model,
          size: row.size,
          colour: normalizeColourLabel(row.colour),
          qtyPlan: Number(row.qtyPlan ?? 0)
        }))
      : [];

    if (headerId) {
      await tx
        .update(planCutting)
        .set({
          noPo: record.noPo,
          model: record.model,
          tanggal: record.tanggal,
          kodePola: record.kodePola ?? "",
          jenisKain: record.jenisKain ?? "",
          updatedAt: new Date()
        })
        .where(eq(planCutting.id, headerId));
    } else {
      const [created] = await tx
        .insert(planCutting)
        .values({
          kodePc: record.kodePc,
          noPo: record.noPo,
          model: record.model,
          tanggal: record.tanggal,
          kodePola: record.kodePola ?? "",
          jenisKain: record.jenisKain ?? "",
          createdBy: userId ?? null
        })
        .returning({ id: planCutting.id });

      headerId = created.id;
    }

    const existingRows = await loadRows(planCuttingRows, planCuttingRows.planCuttingId, headerId);
    const retainedRows = existingRows
      .filter((row) => {
        if (selectedColour) {
          return normalizeColourLabel(row.warna) !== selectedColour;
        }

        return true;
      })
      .map((row) => ({
        kodeSku: row.kodeSku,
        namaProduk: row.namaProduk,
        model: row.model,
        size: row.size,
        warna: normalizeColourLabel(row.warna),
        qtyPlan: Number(row.qtyPlan ?? 0)
      }));

    await tx.delete(planCuttingRows).where(eq(planCuttingRows.planCuttingId, headerId));

    if (retainedRows.length || normalizedIncomingRows.length) {
      await tx.insert(planCuttingRows).values(
        [...retainedRows, ...normalizedIncomingRows.map((row) => ({
          kodeSku: row.sku,
          namaProduk: row.produk,
          model: row.model,
          size: row.size,
          warna: row.colour,
          qtyPlan: row.qtyPlan
        }))].map((row) => ({
          planCuttingId: headerId,
          kodeSku: row.kodeSku,
          namaProduk: row.namaProduk,
          model: row.model,
          size: row.size,
          warna: row.warna,
          qtyPlan: row.qtyPlan
        }))
      );
    }

    return headerId;
  });
}

export async function listCuttingRecords() {
  const headers = await db.select().from(cutting).orderBy(desc(cutting.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const rows = await loadRows(cuttingRows, cuttingRows.cuttingId, header.id);

      return {
        kodePc: header.kodePc,
        noPo: header.noPo,
        model: header.model,
        kodePola: header.kodePola ?? "",
        tanggal: header.tanggal,
        pemotong: header.pemotong ?? "",
        penggelar: header.penggelar ?? "",
        meja: header.meja ?? "",
        rows: rows.map((row) => ({
          sku: row.kodeSku,
          produk: row.namaProduk,
          model: row.model,
          size: row.size,
          colour: normalizeColourLabel(row.warna),
          qtyPlan: Number(row.qtyPlan ?? 0),
          qtyCutting: Number(row.qtyCutting ?? 0)
        }))
      };
    })
  );
}

export async function saveCuttingRecord(record, userId) {
  const [existing] = await db
    .select({ id: cutting.id })
    .from(cutting)
    .where(eq(cutting.kodePc, record.kodePc))
    .limit(1);

  return db.transaction(async (tx) => {
    let headerId = existing?.id;

    if (headerId) {
      await tx
        .update(cutting)
        .set({
          noPo: record.noPo,
          model: record.model,
          kodePola: record.kodePola ?? "",
          tanggal: record.tanggal,
          pemotong: record.pemotong ?? "",
          penggelar: record.penggelar ?? "",
          meja: record.meja ?? "",
          status: "selesai",
          updatedAt: new Date()
        })
        .where(eq(cutting.id, headerId));
    } else {
      const [created] = await tx
        .insert(cutting)
        .values({
          kodePc: record.kodePc,
          noPo: record.noPo,
          model: record.model,
          kodePola: record.kodePola ?? "",
          tanggal: record.tanggal,
          pemotong: record.pemotong ?? "",
          penggelar: record.penggelar ?? "",
          meja: record.meja ?? "",
          status: "selesai",
          createdBy: userId ?? null
        })
        .returning({ id: cutting.id });

      headerId = created.id;
    }

    await tx.delete(cuttingRows).where(eq(cuttingRows.cuttingId, headerId));

    if (Array.isArray(record.rows) && record.rows.length) {
      await tx.insert(cuttingRows).values(
        record.rows.map((row) => ({
          cuttingId: headerId,
            kodeSku: row.sku,
            namaProduk: row.produk,
            model: row.model,
            size: row.size,
            warna: normalizeColourLabel(row.colour),
            qtyPlan: Number(row.qtyPlan ?? 0),
            qtyCutting: Number(row.qtyCutting ?? 0)
          }))
      );
    }

    return headerId;
  });
}

export async function listSeriRecords() {
  const headers = await db.select().from(seri).orderBy(desc(seri.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const entries = await loadRows(seriEntries, seriEntries.seriId, header.id);

      return {
        kodePc: header.kodePc,
        noPo: header.noPo,
        model: header.model,
        kodePola: header.kodePola ?? "",
        tanggal: header.tanggal,
        operator1: header.operator1 ?? "",
        operator2: header.operator2 ?? "",
        nextSequence: Math.max(Number(header.lastSequence ?? 0) + 1, 1),
        entries: entries.map((entry, index) => ({
          entryId: entry.entryId,
          kodePc: entry.kodePc,
          sku: entry.kodeSku,
          produk: entry.namaProduk,
          size: entry.size,
          colour: normalizeColourLabel(entry.warna),
          qtyIkat: Number(entry.qtyIkat ?? 0),
          kodeProduksi: entry.kodeProduksi,
          jenis: entry.jenis ?? "-",
          createdAt: entry.createdAt?.toISOString?.() ?? "",
          sequence: parseSequenceFromCode(entry.kodeProduksi) || index + 1
        }))
      };
    })
  );
}

export async function saveSeriEntry(recordHeader, entry, userId) {
  const [existing] = await db
    .select()
    .from(seri)
    .where(eq(seri.kodePc, recordHeader.kodePc))
    .limit(1);

  return db.transaction(async (tx) => {
    let header = existing;

    if (header) {
      const [updated] = await tx
        .update(seri)
        .set({
          noPo: recordHeader.noPo,
          model: recordHeader.model,
          kodePola: recordHeader.kodePola ?? "",
          tanggal: recordHeader.tanggal,
          operator1: recordHeader.operator1 ?? "",
          operator2: recordHeader.operator2 ?? "",
          lastSequence: Number(header.lastSequence ?? 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(seri.id, header.id))
        .returning();

      header = updated;
    } else {
      const [created] = await tx
        .insert(seri)
        .values({
          kodePc: recordHeader.kodePc,
          noPo: recordHeader.noPo,
          model: recordHeader.model,
          kodePola: recordHeader.kodePola ?? "",
          tanggal: recordHeader.tanggal,
          operator1: recordHeader.operator1 ?? "",
          operator2: recordHeader.operator2 ?? "",
          lastSequence: 1,
          status: "proses",
          createdBy: userId ?? null
        })
        .returning();

      header = created;
    }

    const sequence = Number(header.lastSequence ?? 1);
    const nextEntryId =
      entry.entryId ?? `${recordHeader.kodePc}-${sequence}-${Date.now()}`;

    const [createdEntry] = await tx
      .insert(seriEntries)
      .values({
        seriId: header.id,
        entryId: nextEntryId,
        kodePc: recordHeader.kodePc,
        kodeProduksi: entry.kodeProduksi,
        kodeSku: entry.sku,
        namaProduk: entry.produk,
        model: recordHeader.model,
        size: entry.size,
        warna: normalizeColourLabel(entry.colour),
        qtyIkat: Number(entry.qtyIkat ?? 0),
        jenis: entry.jenis ?? "-"
      })
      .returning();

    return {
      entryId: createdEntry.entryId,
      kodePc: createdEntry.kodePc,
      sku: createdEntry.kodeSku,
      produk: createdEntry.namaProduk,
      size: createdEntry.size,
      colour: normalizeColourLabel(createdEntry.warna),
      qtyIkat: Number(createdEntry.qtyIkat ?? 0),
      kodeProduksi: createdEntry.kodeProduksi,
      jenis: createdEntry.jenis ?? "-",
      createdAt: createdEntry.createdAt?.toISOString?.() ?? "",
      sequence
    };
  });
}

export async function updateSeriEntryQty(kodePc, entryId, qtyIkat) {
  const nextQtyIkat = Number(qtyIkat ?? 0);

  if (!entryId) {
    throw new Error("Entry Seri tidak ditemukan.");
  }

  if (nextQtyIkat <= 0) {
    throw new Error("Qty Ikat harus lebih dari 0.");
  }

  const [matchedEntry] = await db
    .select()
    .from(seriEntries)
    .where(eq(seriEntries.entryId, entryId))
    .limit(1);

  if (!matchedEntry) {
    throw new Error("Entry Seri tidak ditemukan.");
  }

  if (kodePc && matchedEntry.kodePc !== kodePc) {
    throw new Error("Entry Seri tidak cocok dengan Kode PC.");
  }

  const [cuttingHeader] = await db
    .select({ id: cutting.id })
    .from(cutting)
    .where(eq(cutting.kodePc, matchedEntry.kodePc))
    .limit(1);

  if (!cuttingHeader) {
    throw new Error("Data Cutting untuk Kode PC ini tidak ditemukan.");
  }

  const cuttingRecordRows = await loadRows(cuttingRows, cuttingRows.cuttingId, cuttingHeader.id);
  const matchedCuttingRow = cuttingRecordRows.find(
    (row) => row.kodeSku === matchedEntry.kodeSku
  );

  if (!matchedCuttingRow) {
    throw new Error("SKU Cutting untuk entry Seri ini tidak ditemukan.");
  }

  const siblingEntries = await loadRows(seriEntries, seriEntries.seriId, matchedEntry.seriId);
  const totalOtherEntries = siblingEntries
    .filter(
      (entry) =>
        entry.entryId !== matchedEntry.entryId && entry.kodeSku === matchedEntry.kodeSku
    )
    .reduce((total, entry) => total + Number(entry.qtyIkat ?? 0), 0);
  const maxAllowedQty = Number(matchedCuttingRow.qtyCutting ?? 0) - totalOtherEntries;

  if (nextQtyIkat > maxAllowedQty) {
    throw new Error("Qty Ikat melebihi sisa qty cutting untuk SKU ini.");
  }

  return db.transaction(async (tx) => {
    const [updatedEntry] = await tx
      .update(seriEntries)
      .set({
        qtyIkat: nextQtyIkat,
        updatedAt: new Date()
      })
      .where(eq(seriEntries.entryId, matchedEntry.entryId))
      .returning();

    await tx
      .update(seri)
      .set({
        updatedAt: new Date()
      })
      .where(eq(seri.id, matchedEntry.seriId));

    return {
      entryId: updatedEntry.entryId,
      kodePc: updatedEntry.kodePc,
      sku: updatedEntry.kodeSku,
      produk: updatedEntry.namaProduk,
      size: updatedEntry.size,
      colour: normalizeColourLabel(updatedEntry.warna),
      qtyIkat: Number(updatedEntry.qtyIkat ?? 0),
      kodeProduksi: updatedEntry.kodeProduksi,
      jenis: updatedEntry.jenis ?? "-",
      createdAt: updatedEntry.createdAt?.toISOString?.() ?? ""
    };
  });
}

export async function deleteSeriEntryById(kodePc, entryId) {
  const [header] = await db
    .select({ id: seri.id })
    .from(seri)
    .where(eq(seri.kodePc, kodePc))
    .limit(1);

  if (!header) {
    return;
  }

  const entries = await loadRows(seriEntries, seriEntries.seriId, header.id);
  const matched = entries.find((entry) => entry.entryId === entryId);

  if (!matched) {
    return;
  }

  await db.delete(seriEntries).where(eq(seriEntries.entryId, entryId));
}

export async function listRackingRecords() {
  const headers = await db.select().from(racking).orderBy(desc(racking.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const rows = await loadRows(rackingRows, rackingRows.rackingId, header.id);

      return {
        kodePc: header.kodePc,
        noPo: header.noPo ?? "",
        tanggal: header.tanggal,
        operator: header.operator ?? "",
        rows: rows.map((row) => ({
          kodeProduksi: row.kodeProduksi,
          noPo: header.noPo ?? "",
          sku: row.kodeSku,
          model: row.model,
          produk: row.namaProduk,
          warna: normalizeColourLabel(row.warna),
          size: row.size,
          qty: Number(row.qty ?? 0),
          status: row.status,
          jenis: ""
        })),
        totalTarget: Number(header.totalTarget ?? 0),
        totalScanned: Number(header.totalScanned ?? 0),
        status: header.status
      };
    })
  );
}

export async function saveRackingRecord(record, userId) {
  const [existing] = await db
    .select({ id: racking.id })
    .from(racking)
    .where(eq(racking.kodePc, record.kodePc))
    .limit(1);

  return db.transaction(async (tx) => {
    let headerId = existing?.id;

    if (headerId) {
      await tx
        .update(racking)
        .set({
          noPo: record.noPo ?? "",
          tanggal: record.tanggal,
          operator: record.operator ?? "",
          totalTarget: Number(record.totalTarget ?? 0),
          totalScanned: Number(record.totalScanned ?? 0),
          status: record.status?.toLowerCase?.() === "lengkap" ? "lengkap" : "proses",
          updatedAt: new Date()
        })
        .where(eq(racking.id, headerId));
    } else {
      const [created] = await tx
        .insert(racking)
        .values({
          kodePc: record.kodePc,
          noPo: record.noPo ?? "",
          tanggal: record.tanggal,
          operator: record.operator ?? "",
          totalTarget: Number(record.totalTarget ?? 0),
          totalScanned: Number(record.totalScanned ?? 0),
          status: record.status?.toLowerCase?.() === "lengkap" ? "lengkap" : "proses",
          createdBy: userId ?? null
        })
        .returning({ id: racking.id });

      headerId = created.id;
    }

    await tx.delete(rackingRows).where(eq(rackingRows.rackingId, headerId));

    if (Array.isArray(record.rows) && record.rows.length) {
      await tx.insert(rackingRows).values(
        record.rows.map((row) => ({
          rackingId: headerId,
          kodePc: record.kodePc,
          kodeProduksi: row.kodeProduksi,
          kodeSku: row.sku,
          namaProduk: row.produk,
          model: row.model,
          warna: normalizeColourLabel(row.warna),
          size: row.size,
          qty: Number(row.qty ?? 0),
          status: row.status ?? "Terscan"
        }))
      );
    }

    return headerId;
  });
}

export async function listPlanSewingRecords() {
  const headers = await db.select().from(planSewing).orderBy(desc(planSewing.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const rows = await loadRows(planSewingRows, planSewingRows.planSewingId, header.id);

      return {
        kodePc: header.kodePc,
        noPc: header.kodePc,
        noPo: header.noPo,
        kodePs: header.kodePs,
        tanggal: header.tanggal,
        model: header.model,
        rows: rows.map((row) => ({
          sku: row.kodeSku,
          produk: row.namaProduk,
          model: row.model,
          size: row.size,
          colour: normalizeColourLabel(row.warna),
          qtyPlan: Number(row.qtyPlan ?? 0),
          qtyCutting: Number(row.qtyCutting ?? 0),
          qtyPlanSewing: Number(row.qtyPlanSewing ?? 0)
        }))
      };
    })
  );
}

export async function savePlanSewingRecord(record, userId) {
  const [existing] = await db
    .select({ id: planSewing.id })
    .from(planSewing)
    .where(eq(planSewing.kodePc, record.kodePc))
    .limit(1);

  return db.transaction(async (tx) => {
    let headerId = existing?.id;

    if (headerId) {
      await tx
        .update(planSewing)
        .set({
          kodePs: record.kodePs,
          noPo: record.noPo,
          model: record.model,
          tanggal: record.tanggal,
          status: "selesai",
          updatedAt: new Date()
        })
        .where(eq(planSewing.id, headerId));
    } else {
      const [created] = await tx
        .insert(planSewing)
        .values({
          kodePs: record.kodePs,
          kodePc: record.kodePc,
          noPo: record.noPo,
          model: record.model,
          tanggal: record.tanggal,
          status: "selesai",
          createdBy: userId ?? null
        })
        .returning({ id: planSewing.id });

      headerId = created.id;
    }

    await tx.delete(planSewingRows).where(eq(planSewingRows.planSewingId, headerId));

    if (Array.isArray(record.rows) && record.rows.length) {
      await tx.insert(planSewingRows).values(
        record.rows.map((row) => ({
          planSewingId: headerId,
          kodeSku: row.sku,
          noPo: record.noPo,
          namaProduk: row.produk,
          model: row.model,
          size: row.size,
          warna: normalizeColourLabel(row.colour),
          kodePc: record.kodePc,
          qtyPlan: Number(row.qtyPlan ?? 0),
          qtyCutting: Number(row.qtyCutting ?? 0),
          qtyPlanSewing: Number(row.qtyPlanSewing ?? 0)
        }))
      );
    }

    return headerId;
  });
}

export async function listSupplyRecords() {
  const headers = await db.select().from(supply).orderBy(desc(supply.createdAt));

  return Promise.all(
    headers.map(async (header) => {
      const rows = await loadRows(supplyRows, supplyRows.supplyId, header.id);

      return {
        kodePs: header.kodePs,
        kodePc: header.kodePc,
        tanggal: header.tanggal,
        operator: header.operator ?? "",
        rows: rows.map((row) => ({
          kodeProduksi: row.kodeProduksi,
          sku: row.kodeSku,
          produk: row.namaProduk,
          model: row.model,
          warna: normalizeColourLabel(row.warna),
          size: row.size,
          qty: Number(row.qtyActual ?? 0)
        })),
        totalPlan: Number(header.totalPlan ?? 0),
        totalActual: Number(header.totalActual ?? 0),
        status: header.status
      };
    })
  );
}

export async function saveSupplyRecord(record, userId) {
  const [existing] = await db
    .select({ id: supply.id })
    .from(supply)
    .where(eq(supply.kodePs, record.kodePs))
    .limit(1);

  return db.transaction(async (tx) => {
    let headerId = existing?.id;

    if (headerId) {
      await tx
        .update(supply)
        .set({
          kodePc: record.kodePc,
          tanggal: record.tanggal,
          operator: record.operator ?? "",
          totalPlan: Number(record.totalPlan ?? 0),
          totalActual: Number(record.totalActual ?? 0),
          status:
            record.status?.toLowerCase?.() === "sesuai"
              ? "lengkap"
              : "proses",
          updatedAt: new Date()
        })
        .where(eq(supply.id, headerId));
    } else {
      const [created] = await tx
        .insert(supply)
        .values({
          kodePs: record.kodePs,
          kodePc: record.kodePc,
          tanggal: record.tanggal,
          operator: record.operator ?? "",
          totalPlan: Number(record.totalPlan ?? 0),
          totalActual: Number(record.totalActual ?? 0),
          status:
            record.status?.toLowerCase?.() === "sesuai"
              ? "lengkap"
              : "proses",
          createdBy: userId ?? null
        })
        .returning({ id: supply.id });

      headerId = created.id;
    }

    await tx.delete(supplyRows).where(eq(supplyRows.supplyId, headerId));

    if (Array.isArray(record.rows) && record.rows.length) {
      await tx.insert(supplyRows).values(
        record.rows.map((row) => ({
          supplyId: headerId,
          kodeProduksi: row.kodeProduksi,
          kodeSku: row.sku,
          namaProduk: row.produk,
          model: row.model ?? "",
          warna: normalizeColourLabel(row.warna),
          size: row.size,
          qtyPlan: 0,
          qtyActual: Number(row.qty ?? row.qtyActual ?? 0)
        }))
      );
    }

    return headerId;
  });
}

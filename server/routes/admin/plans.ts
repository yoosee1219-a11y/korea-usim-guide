import { Router } from "express";
import { db } from "../../storage/db.js";

const router = Router();

// GET - Get all plans (admin)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name_ko as carrier_name_ko, c.name_en as carrier_name_en
       FROM plans p
       LEFT JOIN carriers c ON p.carrier_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Plans fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET - Get single plan by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, c.name_ko as carrier_name_ko, c.name_en as carrier_name_en
       FROM plans p
       LEFT JOIN carriers c ON p.carrier_id = c.id
       WHERE p.id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Plan fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// POST - Create new plan
router.post("/", async (req, res) => {
  try {
    const {
      carrier_id,
      plan_type,
      payment_type,
      name,
      description,
      description_en,
      description_vi,
      description_th,
      data_amount_gb,
      validity_days,
      voice_minutes,
      sms_count,
      price_krw,
      features,
      features_en,
      features_vi,
      features_th,
      airport_pickup,
      esim_support,
      physical_sim,
      is_popular,
      is_active
    } = req.body;

    const result = await db.query(
      `INSERT INTO plans (
        carrier_id, plan_type, payment_type, name,
        description, description_en, description_vi, description_th,
        data_amount_gb, validity_days, voice_minutes, sms_count, price_krw,
        features, features_en, features_vi, features_th,
        airport_pickup, esim_support, physical_sim, is_popular, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        carrier_id, plan_type, payment_type, name,
        description, description_en, description_vi, description_th,
        data_amount_gb || null, validity_days, voice_minutes || null,
        sms_count || null, price_krw,
        JSON.stringify(features || []),
        JSON.stringify(features_en || []),
        JSON.stringify(features_vi || []),
        JSON.stringify(features_th || []),
        airport_pickup || false, esim_support || false, physical_sim || true,
        is_popular || false, is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Plan create error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// PUT - Update plan
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      carrier_id,
      plan_type,
      payment_type,
      name,
      description,
      description_en,
      description_vi,
      description_th,
      data_amount_gb,
      validity_days,
      voice_minutes,
      sms_count,
      price_krw,
      features,
      features_en,
      features_vi,
      features_th,
      airport_pickup,
      esim_support,
      physical_sim,
      is_popular,
      is_active
    } = req.body;

    const result = await db.query(
      `UPDATE plans SET
        carrier_id = $1, plan_type = $2, payment_type = $3, name = $4,
        description = $5, description_en = $6, description_vi = $7, description_th = $8,
        data_amount_gb = $9, validity_days = $10, voice_minutes = $11, sms_count = $12,
        price_krw = $13,
        features = $14, features_en = $15, features_vi = $16, features_th = $17,
        airport_pickup = $18, esim_support = $19, physical_sim = $20,
        is_popular = $21, is_active = $22,
        updated_at = NOW()
      WHERE id = $23
      RETURNING *`,
      [
        carrier_id, plan_type, payment_type, name,
        description, description_en, description_vi, description_th,
        data_amount_gb || null, validity_days, voice_minutes || null,
        sms_count || null, price_krw,
        JSON.stringify(features || []),
        JSON.stringify(features_en || []),
        JSON.stringify(features_vi || []),
        JSON.stringify(features_th || []),
        airport_pickup || false, esim_support || false, physical_sim || true,
        is_popular || false, is_active !== undefined ? is_active : true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Plan update error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// DELETE - Delete plan
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM plans WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Plan delete error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;

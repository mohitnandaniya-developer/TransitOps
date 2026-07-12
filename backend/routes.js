const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");
const { sendOTPEmail, sendWelcomeEmail, sendPasswordChangeEmail, sendBillEmail } = require("./email");
const { generateRouteAndTracking } = require("./routeIntelligence");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ── Tenant resolution ──────────────────────────────────────────────────────
   Priority: x-company-id header → derive from x-user-email → 'demo'
   Demo accounts (@transitops.io) always map to 'demo' namespace.
──────────────────────────────────────────────────────────────────────────── */
const getCompanyId = (req) => {
    const companyId = req.headers['x-company-id'];
    if (companyId) return companyId;
    const email = req.headers['x-user-email'];
    if (!email || email.endsWith('@transitops.io')) return 'demo';
    return 'demo'; // fallback for unregistered users
};

const getUserRole = (req) => req.headers['x-user-role'] || '';

// Default prices per vehicle type
const DEFAULT_PRICES = {
    'truck': 65,
    'mini-truck': 45,
    'van': 30,
    'bike': 12
};

// ── COMPANIES ──────────────────────────────────────────────────────────────

// Create a new company
router.post("/companies", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Company name is required" });
        }
        // Generate unique CO-XXXX ID
        const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const id = `CO-${suffix}`;
        const result = await db.query(
            "INSERT INTO companies (id, name) VALUES ($1, $2) RETURNING *",
            [id, name.trim()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validate a company ID exists
router.get("/companies/:id", async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, industry FROM companies WHERE id=$1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Invalid Company ID" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recover Company ID by Name
router.post("/companies/recover", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: "Company name is required" });

        // Exact match (case insensitive)
        const result = await db.query("SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1)", [name.trim()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Company not found. Check spelling or register a new one." });
        }
        res.json({ id: result.rows[0].id, name: result.rows[0].name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VEHICLES ---
router.get("/vehicles", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const result = await db.query("SELECT * FROM vehicles WHERE company_id=$1 ORDER BY id ASC", [cid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/vehicles", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id, name, type, plate, capacity, odometer, status, region, retired, price_per_km } = req.body;

        const priceKm = price_per_km != null
            ? Number(price_per_km)
            : (DEFAULT_PRICES[type?.toLowerCase()] ?? 0);

        const result = await db.query(
            "INSERT INTO vehicles (id, name, type, plate, capacity, odometer, status, region, retired, price_per_km, user_email, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
            [id, name, type, plate, capacity, odometer, status || 'available', region, retired || false, priceKm, cid, cid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/vehicles/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const userRole = getUserRole(req);
        const { id } = req.params;
        let { name, type, plate, capacity, odometer, status, region, retired, price_per_km } = req.body;

        // Fix status inconsistency: If marking as available, check if there is an active trip
        if (status === 'available' || retired === false) {
            const activeTrip = await db.query(
                "SELECT id FROM trips WHERE vehicleId=$1 AND status='dispatched' AND company_id=$2 LIMIT 1",
                [id, cid]
            );
            if (activeTrip.rows.length > 0) {
                status = 'on-trip';
            }
        }

        // Only managers can modify price_per_km
        let priceSql = '';
        let priceVal = null;
        if (price_per_km != null) {
            if (userRole.toLowerCase() !== 'manager') {
                return res.status(403).json({ error: "Only managers can modify vehicle pricing" });
            }
            priceSql = ', price_per_km=$11';
            priceVal = Number(price_per_km);
        }

        const params = [name, type, plate, capacity, odometer, status, region, retired, id, cid];
        if (priceVal !== null) params.push(priceVal);

        const result = await db.query(
            `UPDATE vehicles SET name=COALESCE($1, name), type=COALESCE($2, type), plate=COALESCE($3, plate), capacity=COALESCE($4, capacity), odometer=COALESCE($5, odometer), status=COALESCE($6, status), region=COALESCE($7, region), retired=COALESCE($8, retired)${priceSql} WHERE id=$9 AND company_id=$10 RETURNING *`,
            params
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/vehicles/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const role = getUserRole(req);

        if (role !== "Manager") {
            return res.status(403).json({ error: "Only managers can delete vehicles." });
        }

        // Check if vehicle exists
        const vehicleCheck = await db.query("SELECT id FROM vehicles WHERE id=$1 AND company_id=$2", [id, cid]);
        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        // Delete vehicle (related trips, maintenance logs, and fuel expenses will cascade delete)
        await db.query("DELETE FROM vehicles WHERE id=$1 AND company_id=$2", [id, cid]);
        res.json({ message: "Vehicle deleted successfully" });
    } catch (err) {
        console.error("Error deleting vehicle:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- DRIVERS ---
router.get("/drivers", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const result = await db.query("SELECT * FROM drivers WHERE company_id=$1 ORDER BY id ASC", [cid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/drivers", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id, name, license, category, expiry, status, trips, safetyScore, phone } = req.body;
        const result = await db.query(
            "INSERT INTO drivers (id, name, license, category, expiry, status, trips, safetyScore, phone, user_email, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [id, name, license, category, expiry, status || 'available', trips || 0, safetyScore || 100, phone, cid, cid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/drivers/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const { name, license, category, expiry, status, trips, safetyScore, phone } = req.body;
        const result = await db.query(
            "UPDATE drivers SET name=COALESCE($1, name), license=COALESCE($2, license), category=COALESCE($3, category), expiry=COALESCE($4, expiry), status=COALESCE($5, status), trips=COALESCE($6, trips), safetyScore=COALESCE($7, safetyScore), phone=COALESCE($8, phone) WHERE id=$9 AND company_id=$10 RETURNING *",
            [name, license, category, expiry, status, trips, safetyScore, phone, id, cid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/drivers/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const role = getUserRole(req);

        if (role !== "Manager") {
            return res.status(403).json({ error: "Only managers can delete drivers." });
        }

        // Check if driver exists
        const driverCheck = await db.query("SELECT id FROM drivers WHERE id=$1 AND company_id=$2", [id, cid]);
        if (driverCheck.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }

        // Delete driver (related trips will cascade delete due to ON DELETE CASCADE)
        await db.query("DELETE FROM drivers WHERE id=$1 AND company_id=$2", [id, cid]);
        res.json({ message: "Driver deleted successfully" });
    } catch (err) {
        console.error("Error deleting driver:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- TRIPS ---
router.get("/trips", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const result = await db.query(`
      SELECT t.*, v.name as "vehicleName", d.name as "driverName", v.price_per_km as "pricePerKm"
      FROM trips t 
      LEFT JOIN vehicles v ON t.vehicleId = v.id 
      LEFT JOIN drivers d ON t.driverId = d.id 
      WHERE t.company_id = $1
      ORDER BY t.date DESC
    `, [cid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/trips", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id, vehicleId, driverId, fromLocation, toLocation, cargo, status, date, totalKM, baseCost } = req.body;
        const result = await db.query(
            "INSERT INTO trips (id, vehicleId, driverId, fromLocation, toLocation, cargo, status, date, totalKM, baseCost, totalCost, user_email, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
            [id, vehicleId, driverId, fromLocation, toLocation, cargo, status || 'draft', date,
                totalKM || null, baseCost || null, baseCost || null, cid, cid]
        );

        if (result.rows.length > 0) {
            const upTrip = result.rows[0];
            const newStatus = upTrip.status?.toLowerCase();
            if (newStatus === 'dispatched') {
                if (upTrip.vehicleid) await db.query("UPDATE vehicles SET status='on-trip' WHERE id=$1 AND company_id=$2", [upTrip.vehicleid, cid]);
                if (upTrip.driverid) await db.query("UPDATE drivers SET status='on-duty' WHERE id=$1 AND company_id=$2", [upTrip.driverid, cid]);
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/trips/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const userRole = getUserRole(req);
        const { id } = req.params;
        const { status, totalKM, extraKM, baseCost, tollCost, otherCost, totalCost } = req.body;

        const hasCostFields = (totalCost != null || tollCost != null || otherCost != null);
        if (hasCostFields && userRole.toLowerCase() !== 'manager') {
            return res.status(403).json({ error: "Only managers can complete trips with cost data" });
        }

        const result = await db.query(
            `UPDATE trips SET
               status    = COALESCE($1, status),
               totalKM   = COALESCE($2, totalKM),
               extraKM   = COALESCE($3, extraKM),
               baseCost  = COALESCE($4, baseCost),
               tollCost  = COALESCE($5, tollCost),
               otherCost = COALESCE($6, otherCost),
               totalCost = COALESCE($7, totalCost)
             WHERE id=$8 AND company_id=$9 RETURNING *`,
            [status, totalKM ?? null, extraKM ?? null, baseCost ?? null, tollCost ?? null, otherCost ?? null, totalCost ?? null, id, cid]
        );

        if (result.rows.length > 0) {
            const upTrip = result.rows[0];
            const newStatus = upTrip.status?.toLowerCase();

            if (newStatus === 'completed' || newStatus === 'cancelled') {
                if (upTrip.vehicleid) await db.query("UPDATE vehicles SET status='available' WHERE id=$1 AND company_id=$2", [upTrip.vehicleid, cid]);
                if (upTrip.driverid) await db.query("UPDATE drivers SET status='available' WHERE id=$1 AND company_id=$2", [upTrip.driverid, cid]);
                
                // CRITICAL: When trip is completed, update vehicle odometer
                // NOTE: Only use totalKM for odometer. extraKM is for billing/tracking only, not actual distance
                if (newStatus === 'completed' && (upTrip.totalkm || upTrip.totalKM)) {
                    const actualDistance = Number(upTrip.totalkm || upTrip.totalKM) || 0;
                    
                    // Get current odometer reading
                    const currentVehicle = await db.query("SELECT odometer FROM vehicles WHERE id=$1 AND company_id=$2", [upTrip.vehicleid, cid]);
                    if (currentVehicle.rows.length > 0) {
                        const currentOdometer = Number(currentVehicle.rows[0].odometer) || 0;
                        const newOdometer = currentOdometer + actualDistance;
                        
                        // Update vehicle odometer with only the actual distance traveled
                        await db.query(
                            "UPDATE vehicles SET odometer=$1 WHERE id=$2 AND company_id=$3",
                            [newOdometer, upTrip.vehicleid, cid]
                        );
                    }
                }
            } else if (newStatus === 'dispatched') {
                if (upTrip.vehicleid) await db.query("UPDATE vehicles SET status='on-trip' WHERE id=$1 AND company_id=$2", [upTrip.vehicleid, cid]);
                if (upTrip.driverid) await db.query("UPDATE drivers SET status='on-duty' WHERE id=$1 AND company_id=$2", [upTrip.driverid, cid]);
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/trips/:id/email-bill", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const { email, customerName, tripData, pdfBase64 } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Customer email is required" });
        }

        const companyRes = await db.query("SELECT name, industry FROM companies WHERE id=$1", [cid]);
        const companyInfo = companyRes.rows[0];

        const success = await sendBillEmail(email, tripData, companyInfo, pdfBase64, customerName);
        
        if (success) {
            res.json({ message: "Bill sent successfully to " + email });
        } else {
            res.status(500).json({ error: "Failed to send the bill email." });
        }
    } catch (err) {
        console.error("Error sending bill:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/trips/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const role = getUserRole(req);

        if (role !== "Manager") {
            return res.status(403).json({ error: "Only managers can delete trips." });
        }

        const tripRes = await db.query("SELECT * FROM trips WHERE id=$1 AND company_id=$2", [id, cid]);
        if (tripRes.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }
        
        const trip = tripRes.rows[0];

        if (trip.status === "dispatched") {
            if (trip.vehicleid) await db.query("UPDATE vehicles SET status='available' WHERE id=$1 AND company_id=$2", [trip.vehicleid, cid]);
            if (trip.driverid) await db.query("UPDATE drivers SET status='available' WHERE id=$1 AND company_id=$2", [trip.driverid, cid]);
        }

        await db.query("DELETE FROM trips WHERE id=$1 AND company_id=$2", [id, cid]);
        res.json({ message: "Trip deleted successfully" });
    } catch (err) {
        console.error("Error deleting trip:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- MAINTENANCE LOGS ---
router.get("/maintenance", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const result = await db.query(`
      SELECT m.*, v.name as "vehicleName" 
      FROM maintenance_logs m 
      LEFT JOIN vehicles v ON m.vehicleId = v.id 
      WHERE m.company_id = $1
      ORDER BY m.date DESC
    `, [cid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/maintenance", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id, vehicleId, type, title, desc, date, cost, status, tech } = req.body;

        const result = await db.query(
            `INSERT INTO maintenance_logs (id, vehicleId, type, title, "desc", date, cost, status, tech, user_email, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [id, vehicleId, type, title, desc, date, cost, status || 'in-shop', tech, cid, cid]
        );

        // CRITICAL: When maintenance is created, update vehicle status to out-of-service (In Shop)
        if (status !== 'completed') {
            console.log(`🔄 SYNCHRONIZING: Maintenance ${id} created - updating vehicle status to out-of-service`);

            await db.query(
                "UPDATE vehicles SET status='out-of-service' WHERE id=$1 AND company_id=$2",
                [vehicleId, cid]
            );

            console.log(`✅ SYNCHRONIZED: Vehicle ${vehicleId} set to out-of-service (maintenance created)`);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error creating maintenance:", err);
        res.status(500).json({ error: err.message });
    }
});

router.put("/maintenance/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const { status } = req.body;

        // Get current maintenance data before update for synchronization
        const currentMaintenance = await db.query("SELECT vehicleid, status FROM maintenance_logs WHERE id=$1 AND company_id=$2", [id, cid]);

        if (currentMaintenance.rows.length === 0) {
            return res.status(404).json({ error: "Maintenance record not found" });
        }

        const maintenanceData = currentMaintenance.rows[0];

        // CRITICAL: When maintenance is marked as completed, update vehicle status to available
        if (status === 'completed' && maintenanceData.status !== 'completed') {
            console.log(`🔄 SYNCHRONIZING: Maintenance ${id} completed - updating vehicle status to available`);

            await db.query(
                "UPDATE vehicles SET status='available' WHERE id=$1 AND company_id=$2",
                [maintenanceData.vehicleid, cid]
            );

            console.log(`✅ SYNCHRONIZED: Vehicle ${maintenanceData.vehicleid} set to available (maintenance completed)`);
        }

        const result = await db.query(
            "UPDATE maintenance_logs SET status=$1 WHERE id=$2 AND company_id=$3 RETURNING *",
            [status, id, cid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating maintenance:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/maintenance/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const role = getUserRole(req);

        if (role !== "Manager") {
            return res.status(403).json({ error: "Only managers can delete maintenance logs." });
        }

        await db.query("DELETE FROM maintenance_logs WHERE id=$1 AND company_id=$2", [id, cid]);
        res.json({ message: "Maintenance log deleted successfully" });
    } catch (err) {
        console.error("Error deleting maintenance log:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- FUEL EXPENSES ---
router.get("/expenses", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const result = await db.query(`
      SELECT e.*, v.name as "vehicleName" 
      FROM fuel_expenses e 
      LEFT JOIN vehicles v ON e.vehicleId = v.id 
      WHERE e.company_id = $1
      ORDER BY e.date DESC
    `, [cid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/expenses", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id, vehicleId, type, date, liters, pricePerL, tripId, cost, note } = req.body;
        const result = await db.query(
            "INSERT INTO fuel_expenses (id, vehicleId, type, date, liters, pricePerL, tripId, cost, note, user_email, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
            [id, vehicleId, type, date, liters || null, pricePerL || null, tripId || null, cost, note, cid, cid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/expenses/:id", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { id } = req.params;
        const role = getUserRole(req);

        if (role !== "Manager") {
            return res.status(403).json({ error: "Only managers can delete fuel expenses." });
        }

        await db.query("DELETE FROM fuel_expenses WHERE id=$1 AND company_id=$2", [id, cid]);
        res.json({ message: "Fuel expense deleted successfully" });
    } catch (err) {
        console.error("Error deleting fuel expense:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- AUTHENTICATION ---
router.post("/auth/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const result = await db.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];

            let valid = false;
            if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
                valid = await bcrypt.compare(password, user.password);
            } else {
                valid = (password === user.password);
            }

            if (!valid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            if (user.role !== role) {
                return res.status(401).json({
                    error: `You are registered as ${user.role}, please login as ${user.role}`,
                    actualRole: user.role
                });
            }

            // Determine company_id
            const companyId = user.company_id || (email.endsWith('@transitops.io') ? 'demo' : 'demo');

            // Fetch company details
            const companyRes = await db.query("SELECT name, industry FROM companies WHERE id=$1", [companyId]);
            const company = companyRes.rows[0] || { name: "TransitOps Demo Company", industry: "Logistics & Transportation" };

            res.json({
                id: user.id,
                email: user.email,
                role: user.role,
                companyId,
                companyName: company.name,
                companyIndustry: company.industry
            });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REGISTER ---
router.post("/auth/register", async (req, res) => {
    try {
        const { email, password, role, companyId } = req.body;

        // Validate Company ID
        if (!companyId) {
            return res.status(400).json({ error: "Company ID is required" });
        }
        const companyCheck = await db.query("SELECT id, name FROM companies WHERE id=$1", [companyId]);
        if (companyCheck.rows.length === 0) {
            return res.status(400).json({ error: "Invalid Company ID — please check and try again" });
        }

        const existing = await db.query("SELECT id FROM users WHERE email=$1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            "INSERT INTO users (email, password, role, company_id) VALUES ($1, $2, $3, $4) RETURNING id, email, role, company_id",
            [email, hashedPassword, role, companyId]
        );

        sendWelcomeEmail(email, null).catch(err => console.error("Welcome email failed:", err));

        res.json({ ...result.rows[0], companyId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FORGOT PASSWORD ---
router.post("/auth/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const result = await db.query("SELECT id FROM users WHERE email=$1", [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email is not registered" });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 15 * 60 * 1000;

        const existing = await db.query("SELECT id FROM password_resets WHERE email=$1", [email]);
        if (existing.rows.length > 0) {
            await db.query("UPDATE password_resets SET otp=$1, expires_at=$2 WHERE email=$3", [otp, expiresAt, email]);
        } else {
            await db.query("INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, $3)", [email, otp, expiresAt]);
        }

        const emailSent = await sendOTPEmail(email, otp);
        if (emailSent) {
            res.json({ message: "OTP sent to email" });
        } else {
            res.status(500).json({ error: "Failed to send email" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VERIFY OTP ---
router.post("/auth/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await db.query("SELECT * FROM password_resets WHERE email=$1 AND otp=$2", [email, otp]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        if (Date.now() > parseInt(result.rows[0].expires_at)) {
            await db.query("DELETE FROM password_resets WHERE email=$1", [email]);
            return res.status(400).json({ error: "OTP has expired" });
        }

        res.json({ message: "OTP verified correctly" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RESET PASSWORD ---
router.post("/auth/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await db.query("SELECT * FROM password_resets WHERE email=$1 AND otp=$2", [email, otp]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        if (Date.now() > parseInt(result.rows[0].expires_at)) {
            await db.query("DELETE FROM password_resets WHERE email=$1", [email]);
            return res.status(400).json({ error: "OTP has expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password=$1 WHERE email=$2", [hashedPassword, email]);
        await db.query("DELETE FROM password_resets WHERE email=$1", [email]);

        sendPasswordChangeEmail(email).catch(err => console.error("Password change email failed:", err));

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ROUTE INTELLIGENCE & LIVE TRACKING ---

// Generate route with checkpoints and live tracking
router.post("/route/generate", async (req, res) => {
    try {
        const { source, destination, trip_start_time, current_time, average_speed_kmph } = req.body;

        // Debug logging
        console.log('🚀 Route Generation Request:');
        console.log('   Source:', source);
        console.log('   Destination:', destination);
        console.log('   Trip Start:', trip_start_time);
        console.log('   Current Time:', current_time);

        // Validate required fields
        if (!source || !destination || !trip_start_time || !current_time) {
            return res.status(400).json({ 
                error: "Missing required fields: source, destination, trip_start_time, current_time" 
            });
        }

        // Generate route and tracking data
        const result = generateRouteAndTracking(
            source,
            destination,
            trip_start_time,
            current_time,
            average_speed_kmph || 45
        );

        if (result.error) {
            console.error("Route generation failed:", result.error);
            return res.status(400).json(result);
        }

        // Debug logging for result
        console.log('✅ Route Generated:');
        console.log('   Route:', result.route.map(r => r.location).join(' → '));

        res.json(result);
    } catch (err) {
        console.error("Error generating route:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get live tracking for a specific trip
router.get("/route/tracking/:tripId", async (req, res) => {
    try {
        const cid = getCompanyId(req);
        const { tripId } = req.params;

        // Get trip details
        const tripRes = await db.query(
            "SELECT * FROM trips WHERE id=$1 AND company_id=$2",
            [tripId, cid]
        );

        if (tripRes.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        const trip = tripRes.rows[0];

        // Get vehicle and driver info
        const vehicleRes = await db.query("SELECT name FROM vehicles WHERE id=$1", [trip.vehicleid]);
        const driverRes = await db.query("SELECT name FROM drivers WHERE id=$1", [trip.driverid]);

        const vehicle = vehicleRes.rows[0];
        const driver = driverRes.rows[0];

        // Generate route data
        const routeData = generateRouteAndTracking(
            trip.fromlocation,
            trip.tolocation,
            trip.date ? new Date(trip.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            45
        );

        res.json({
            trip_id: tripId,
            vehicle: vehicle?.name || 'Unknown',
            driver: driver?.name || 'Unknown',
            ...routeData,
        });
    } catch (err) {
        console.error("Error fetching tracking:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get all available cities for route planning
router.get("/route/cities", async (req, res) => {
    try {
        const { generateRouteAndTracking: _, ...routeIntel } = require("./routeIntelligence");
        const INDIA_CITIES = {
            'Mumbai': { state: 'Maharashtra' },
            'Delhi': { state: 'Delhi' },
            'Bangalore': { state: 'Karnataka' },
            'Hyderabad': { state: 'Telangana' },
            'Chennai': { state: 'Tamil Nadu' },
            'Kolkata': { state: 'West Bengal' },
            'Pune': { state: 'Maharashtra' },
            'Ahmedabad': { state: 'Gujarat' },
            'Jaipur': { state: 'Rajasthan' },
            'Lucknow': { state: 'Uttar Pradesh' },
            'Surat': { state: 'Gujarat' },
            'Chandigarh': { state: 'Chandigarh' },
            'Indore': { state: 'Madhya Pradesh' },
            'Bhopal': { state: 'Madhya Pradesh' },
            'Vadodara': { state: 'Gujarat' },
            'Ghaziabad': { state: 'Uttar Pradesh' },
            'Ludhiana': { state: 'Punjab' },
            'Nagpur': { state: 'Maharashtra' },
            'Nashik': { state: 'Maharashtra' },
            'Aurangabad': { state: 'Maharashtra' },
            'Belgaum': { state: 'Karnataka' },
            'Mysore': { state: 'Karnataka' },
            'Coimbatore': { state: 'Tamil Nadu' },
            'Kochi': { state: 'Kerala' },
            'Thiruvananthapuram': { state: 'Kerala' },
            'Visakhapatnam': { state: 'Andhra Pradesh' },
            'Vijayawada': { state: 'Andhra Pradesh' },
            'Guwahati': { state: 'Assam' },
            'Patna': { state: 'Bihar' },
            'Ranchi': { state: 'Jharkhand' },
            'Raipur': { state: 'Chhattisgarh' },
            'Agra': { state: 'Uttar Pradesh' },
            'Kanpur': { state: 'Uttar Pradesh' },
            'Varanasi': { state: 'Uttar Pradesh' },
            'Allahabad': { state: 'Uttar Pradesh' },
            'Meerut': { state: 'Uttar Pradesh' },
            'Noida': { state: 'Uttar Pradesh' },
            'Gurgaon': { state: 'Haryana' },
            'Faridabad': { state: 'Haryana' },
            'Amritsar': { state: 'Punjab' },
            'Jalandhar': { state: 'Punjab' },
            'Kota': { state: 'Rajasthan' },
            'Jodhpur': { state: 'Rajasthan' },
            'Udaipur': { state: 'Rajasthan' },
            'Ajmer': { state: 'Rajasthan' },
            'Bikaner': { state: 'Rajasthan' },
            'Bhavnagar': { state: 'Gujarat' },
            'Rajkot': { state: 'Gujarat' },
            'Junagadh': { state: 'Gujarat' },
            'Gandhinagar': { state: 'Gujarat' },
            'Anand': { state: 'Gujarat' },
            'Vapi': { state: 'Gujarat' },
        };

        const cities = Object.keys(INDIA_CITIES).map(city => ({
            name: city,
            state: INDIA_CITIES[city].state,
        }));

        res.json({ cities: cities.sort((a, b) => a.name.localeCompare(b.name)) });
    } catch (err) {
        console.error("Error fetching cities:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

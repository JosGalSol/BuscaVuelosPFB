// Importamos la función que me permite conectarme a la base de datos.
import { getPool } from '../../db/getPool.js';

// Importamos la función que genera un error.
import generateErrorUtil from '../../utils/generateErrorUtil.js';

// Función que se conecta a la base de datos para guardar un criterio de busqueda.
const saveUserFavoriteModel = async (
    title = null,
    origin,
    destination,
    departureDate,
    adults,
    userId,
) => {
    // Obtenemos el pool.
    const pool = await getPool();

    // Verificamos si el favorito ya existe para el usuario.
    const [[existingFavorite]] = await pool.query(
        `SELECT favoriteId FROM favorites WHERE origin = ? AND destination = ? 
         AND departureDate = ? AND adults = ? AND userId = ?`,
        [origin, destination, departureDate, adults, userId],
    );

    // Si el favorito ya existe, generamos un error.
    if (existingFavorite) {
        generateErrorUtil('Esta búsqueda ya está guardada en favoritos', 409);
    }
    // Generamos la fecha actual.
    const now = new Date();

    // Insertamos el listado de criterios de busqueda favoritos a la base de datos con el id del usuario.
    const [newFavorite] = await pool.query(
        `INSERT INTO favorites (title, origin, destination, departureDate, adults, userId) 
          VALUES (?, ?, ?, ?, ?, ?)`,
        [title, origin, destination, departureDate, adults, userId],
    );

    // Obtenemos el id del criterio de busqueda que acabamos de insertar.
    return newFavorite.insertId;
};

export default saveUserFavoriteModel;

import generateErrorUtil from '../../utils/generateErrorUtil.js';
import { globalFlights } from './searchFlightsController.js';

// Controlador para filtrar la lista de vuelos almacenada
const filterFlightListController = ( req, res, next ) => {
    try
    {
        // Validar que haya vuelos almacenados
        if ( !globalFlights || globalFlights.length === 0 )
        {
            throw generateErrorUtil(
                'No hay vuelos disponibles para filtrar. Realiza una búsqueda primero.',
                404,
            );
        }

        // Obtener los parámetros de filtrado del query
        const {
            airline,
            minPrice,
            maxPrice,
            departureTime,
            arrivalTime,
            class: travelClass,
            stops,
            sortByPrice,
            page = 1, // Página por defecto: 1
            limit = 10, // Límite de resultados por página: 10
        } = req.query;

        // Validar que los parámetros de paginación sean números válidos
        const parsedPage = parseInt( page );
        const parsedLimit = parseInt( limit );
        if ( isNaN( parsedPage ) )
        {
            throw generateErrorUtil(
                'El parámetro "page" debe ser un número válido.',
                400,
            );
        }
        if ( isNaN( parsedLimit ) )
        {
            throw generateErrorUtil(
                'El parámetro "limit" debe ser un número válido.',
                400,
            );
        }

        // Validar que no se filtren ambas horas al mismo tiempo
        if ( departureTime && arrivalTime )
        {
            throw generateErrorUtil(
                'No se puede filtrar por "departureTime" y "arrivalTime" al mismo tiempo.',
                400,
            );
        }

        // Aplicar los filtros
        let filteredFlights = globalFlights;

        // Filtro por aerolínea
        if ( airline )
        {
            const airlineUpper = airline.toUpperCase();
            const airlineExists = filteredFlights.some( ( flight ) =>
                flight.validatingAirlineCodes?.includes( airlineUpper ),
            );
            if ( !airlineExists )
            {
                throw generateErrorUtil(
                    `La aerolínea "${ airline }" no se encuentra en los resultados de búsqueda.`,
                    400,
                );
            }
            filteredFlights = filteredFlights.filter( ( flight ) =>
                flight.validatingAirlineCodes?.includes( airlineUpper ),
            );
        }

        // Filtro por precio mínimo
        if ( minPrice )
        {
            const parsedMinPrice = parseFloat( minPrice );
            if ( isNaN( parsedMinPrice ) )
            {
                throw generateErrorUtil(
                    'El parámetro "minPrice" debe ser un número válido.',
                    400,
                );
            }
            filteredFlights = filteredFlights.filter(
                ( flight ) => parseFloat( flight.price?.total ) >= parsedMinPrice,
            );
        }

        // Filtro por precio máximo
        if ( maxPrice )
        {
            const parsedMaxPrice = parseFloat( maxPrice );
            if ( isNaN( parsedMaxPrice ) )
            {
                throw generateErrorUtil(
                    'El parámetro "maxPrice" debe ser un número válido.',
                    400,
                );
            }
            filteredFlights = filteredFlights.filter(
                ( flight ) => parseFloat( flight.price?.total ) <= parsedMaxPrice,
            );
        }

        // Filtro por horario de salida
        if ( departureTime )
        {
            const departureHour = parseInt( departureTime.split( ':' )[ 0 ], 10 );
            if ( isNaN( departureHour ) )
            {
                throw generateErrorUtil(
                    'El parámetro "departureTime" debe ser una hora válida en formato HH:MM.',
                    400,
                );
            }
            filteredFlights = filteredFlights.filter( ( flight ) => {
                const flightHour = new Date( flight.itineraries[ 0 ]?.segments[ 0 ]?.departure?.at )
                    .getUTCHours();
                return flightHour === departureHour;
            } );
        }

        // Filtro por horario de llegada
        if ( arrivalTime )
        {
            const arrivalHour = parseInt( arrivalTime.split( ':' )[ 0 ], 10 );
            if ( isNaN( arrivalHour ) )
            {
                throw generateErrorUtil(
                    'El parámetro "arrivalTime" debe ser una hora válida en formato HH:MM.',
                    400,
                );
            }
            filteredFlights = filteredFlights.filter( ( flight ) => {
                const lastSegment = flight.itineraries[ 0 ]?.segments[ flight.itineraries[ 0 ]?.segments.length - 1 ];
                const flightHour = new Date( lastSegment?.arrival?.at )
                    .getUTCHours();
                return flightHour === arrivalHour;
            } );
        }

        // Filtro por clase de billete
        if ( travelClass )
        {
            const validClasses = [ 'a', 'f', 'p', 'r', 'c', 'd', 'i', 'j', 'z' ];
            if ( !validClasses.includes( travelClass.toLowerCase() ) )
            {
                throw generateErrorUtil(
                    'El parámetro "class" debe ser una de las siguientes clases: a, f, p, r, c, d, i, j, z.',
                    400,
                );
            }
            filteredFlights = filteredFlights.filter( ( flight ) =>
                flight.travelerPricings?.some(
                    ( pricing ) => pricing.fareDetailsBySegment?.some(
                        ( fareDetail ) => fareDetail.class === travelClass.toUpperCase()
                    )
                ),
            );
        }

        // Filtro por cantidad de escalas
        if ( stops )
        {
            const parsedStops = parseInt( stops );
            if ( isNaN( parsedStops ) )
            {
                throw generateErrorUtil(
                    'El parámetro "stops" debe ser un número válido.',
                    400,
                );
            }
            const stopsExist = filteredFlights.some( ( flight ) =>
                flight.itineraries[ 0 ]?.segments.length - 1 === parsedStops,
            );
            if ( !stopsExist )
            {
                throw generateErrorUtil(
                    `No hay vuelos con ${ parsedStops } escalas en los resultados de búsqueda.`,
                    400,
                );
            }
            filteredFlights = filteredFlights.filter( ( flight ) =>
                flight.itineraries[ 0 ]?.segments.length - 1 === parsedStops,
            );
        }

        // Ordenar por precio
        if ( sortByPrice )
        {
            const sortAscending = sortByPrice.toLowerCase() === 'true';
            filteredFlights = filteredFlights.sort( ( a, b ) => {
                const priceA = parseFloat( a.price?.total );
                const priceB = parseFloat( b.price?.total );
                return sortAscending ? priceA - priceB : priceB - priceA;
            } );
        }

        // Paginación
        const startIndex = ( parsedPage - 1 ) * parsedLimit;
        const endIndex = parsedPage * parsedLimit;
        const paginatedFlights = filteredFlights.slice( startIndex, endIndex );

        // Enviar la respuesta con los vuelos filtrados y paginados
        res.status( 200 ).send( {
            status: 'ok',
            data: paginatedFlights,
            pagination: {
                totalFlights: filteredFlights.length,
                totalPages: Math.ceil( filteredFlights.length / parsedLimit ),
                currentPage: parsedPage,
                flightsPerPage: parsedLimit,
            },
            message: 'Lista de vuelos filtrada y paginada con éxito',
        } );
    } catch ( err )
    {
        next( err );
    }
};

export { filterFlightListController };
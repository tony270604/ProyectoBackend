export function success(req, res, mensaje = "", status = 200) {
    res.status(status).send({
        error: false,
        status: status,
        body: mensaje
    });
}

export function error(req, res, mensaje = "Error interno", status = 500) {
    res.status(status).send({
        error: true,
        status: status,
        body: mensaje
    });
}

import jwt from "jsonwebtoken"

export function generatePasswordTimer(payload) {
    const key = process.env.TOKEN_PASS_REFRESH_MAIL_KEY
    const timer = 300
    return jwt.sign({ data: payload }, key, {
        expiresIn: timer,
    })
}
export function verifyTokenPasswordTimer(token) {
    const key = process.env.TOKEN_PASS_REFRESH_MAIL_KEY
    try {
        return { payload: jwt.verify(token, key), expired: false }
    } catch (error) {
        if (error.name == 'TokenExpiredError') {
            return { payload: jwt.decode(token), expired: true }
        }
        throw error
    }
}

export function generateToken(type = 'access', payload, tokenLife) {
    const key = type
        ? process.env.TOKEN_SECRET_KEY
        : process.env.REFRESH_TOKEN_SECRET_KEY

    const access_token = jwt.sign({ data: payload }, key, {
        expiresIn: tokenLife,
    })

    const expires_at = new Date(Date.now() + jwt.decode(access_token).exp);

    const token = {
        access_token,
        expires_at
    }

    return token
}

export function verifyToken(type = 'access', token) {
    const key = type
        ? process.env.TOKEN_SECRET_KEY
        : process.env.REFRESH_TOKEN_SECRET_KEY

    try {
        return { payload: jwt.verify(token, key), expired: false }
    } catch (error) {
        if (error.name == 'TokenExpiredError') {
            return { payload: jwt.decode(token), expired: true }
        }
        throw error
    }
}
export function signatureToken(token) {
    return token.split('.')[2]
}

export function randomTokenString() {
    // @ts-ignore
    return Crypto.randomBytes(40).toString('hex')
}

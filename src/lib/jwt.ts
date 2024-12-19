import jwt from 'jsonwebtoken';

class JWT {
    private secretKey = process.env.SECRET_KEY || "2L0D1S8_2M0_2M1_0G1";

    sign(data: any,expiresIn: number = 60*60): string { //60 Minutos * 60 Sgundos =  1 Hora
        return jwt.sign({ user: data}, this.secretKey, { expiresIn});
    }

    verify(token: string): string {
        try {
            return jwt.verify(token, this.secretKey) as string;
        } catch (e) { // no modificar, evalúa el texto en otro 
            return "Token es inválida.";
        }
    }
}

export default JWT;
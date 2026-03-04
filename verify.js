const fs = require('fs');

const defaultIds = [
    '1519681393784-d120267933ba', '1490730141103-6cac27aaab94', '1464822759023-fed622ff2c3b',
    '1518173946687-a4c8892bbd9f', '1441974231531-c6227db76b6e', '1447752875215-b2761acb3c5d',
    '1473448912268-2022ce9509d8', '1426604966848-d7adac402bff', '1469474968028-56623f02e42e',
    '1472214103451-9374bd1c798e', '1433086966358-54859d0ed716', '1501854140801-50d01698950b',
    '1431794062232-2a99a5431c6c', '1470252649378-9c29740c9fa8', '1475924156734-496f6cac6ec1',
    '1425321395722-b1dd54a97cf3', '1465056836041-7f43ac27dcb5', '1445264618000-f1e069c5920f',
    '1503614472-8c93e5a52f9c', '1506744626770-9831a29aa4fa', '1532274402911-5a36b10d14d9',
    '1470770841072-f9d2d2a45d04', '1465146344425-f00d5f5c8f07', '1482938289607-e9573fc25ebb',
    '1511497584788-876760111969', '1494500764479-0c8f2919a3d4', '1490682143684-14369e18dce8',
    '1508614589041-895b88991e42', '1470071131384-001b85755b36', '1493246507139-91e8fad9978e',
    '1542204165-65bf26472b9b', '1436450412740-6b988f486c6b'
];

async function check() {
    const valid = [];
    for (const id of defaultIds) {
        if (valid.length >= 25) break;
        const url = `https://images.unsplash.com/photo-${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80`;
        try {
            const res = await fetch(url);
            if (res.status === 200) {
                valid.push(url);
            }
        } catch (e) { }
    }

    const content = `export const BACKGROUNDS: string[] = [\n  ${valid.map(v => `'${v}'`).join(',\n  ')}\n];\n`;
    fs.writeFileSync('./src/data/backgrounds.ts', content);
    console.log('Saved ' + valid.length + ' backgrounds to backgrounds.ts!');
}
check();

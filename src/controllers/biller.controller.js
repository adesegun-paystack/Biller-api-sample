const SECRET_KEY = process.env.BILLER_SECRET_KEY;
const crypto = require('crypto');
const Chance = require('chance');
let organization = 'ENG';

const chance = new Chance();

const fields_a = {
    'action': 'collect',
    'request_id': 'a32f',
    'title': 'Org Select',
    'fields': [
        {
            'type': 'selector',
            'id': 'organization_selector',
            'title': 'Select Organization',
            'options': {
                'selector_options': [
                    {
                        'text': 'Engineering',
                        'value': 'ENG'
                    },
                    {
                        'text': 'Product',
                        'value': 'PRD'
                    }
                ]
            }
        }
    ],
    'metadata': {
        "sample_md_1": "sample md value 1",
        "sample_md_2": "sample md value 2",
        "custom_fields": [
            {
                "display_name": "Invoice ID",
                "variable_name": "Invoice ID",
                "value": "209"
            }
        ]
    }
};

const fields_b = {
    'action': 'collect',
    'request_id': 'a32fe',
    'title': 'Personal Info',
    'fields': [
        {
            'type': 'email',
            'id': 'customer_email',
            'title': 'Enter your email address',
        },
        {
            'type': 'alphanumeric',
            'id': 'customer_name',
            'title': 'Enter your name',
            'validation': {
                'length': {
                    'min': '2',
                    'max': '50'
                }
            }
        },
        {
            'type': 'date',
            'id': 'date_of_birth',
            'title': 'Enter your DOB',
            'validation': {
                'date': {
                    'before': '06-10-2001',
                    'after': '06-10-1951'
                }
            }
        },
        {
            'type': 'selector',
            'id': 'origin_country',
            'title': 'Select Country of Origin',
            'options': {
                'selector_options': [
                    {
                        'text': 'Nigeria',
                        'value': 'NG'
                    },
                    {
                        'text': 'South Africa',
                        'value': 'SA'
                    }
                ]
            }
        }
    ]
};

const createRequestPayloadHash = (params) => {
    const {
        integrationKey,
        body,
        date,
        method,
        path,
    } = params;
    const bodyToHash = method !== 'GET' ? JSON.stringify(body) : '';

    const bodyHash = crypto.createHash('md5')
        .update(bodyToHash)
        .digest('hex');

    const text = [method, path, date, bodyHash];

    console.log(`
${JSON.stringify(params)}

${bodyToHash},

${bodyHash},

${JSON.stringify(text)}
`);

    return crypto.createHmac('sha512', integrationKey)
        .update(text.join('\n'))
        .digest('hex');
};

const validateRequest = (req) => {
    const {
        headers: {
            authorization,
            date,
        },
        method,
        body,
        originalUrl,
    } = req;

    const params = {
        integrationKey: SECRET_KEY,
        body,
        date,
        method,
        path: originalUrl.split('?')[0],
    };

    const hash = createRequestPayloadHash(params);
    const components = authorization.split(' ');
    console.log(`Component: ${components[1]}
hash: ${hash}
secret key ${SECRET_KEY}`);
    return components[1] === hash;
};

const createResponsePayloadHash = (integrationKey, date, body) => {
    const bodyToHash = JSON.stringify(body);

    const bodyHash = crypto.createHash('md5')
        .update(bodyToHash)
        .digest('hex');

    const text = [date, bodyHash];

    return crypto.createHmac('sha512', integrationKey)
        .update(text.join('\n'))
        .digest('hex');
};

const sendSuccessfulResponse = (res, body) => {
    const date = new Date().toISOString();
    const hash = createResponsePayloadHash(SECRET_KEY, date, body);
    res.set('date', date);
    res.set('authorization', `Bearer ${hash}`);
    res.status(200)
        .send(body);
};

const getFields = (req, res) => {
    const isValidRequest = validateRequest(req);

    if (!isValidRequest) {
        return res.status(401)
            .send({ message: 'Invalid request sent' });
    }

    sendSuccessfulResponse(res, fields_a);
};

const processFields = (req, res) => {
    const isValidRequest = validateRequest(req);
    if (!isValidRequest) {
        return res.status(401)
            .send({ message: 'Invalid request sent' });
    }

    const {
        body: {
            request_id,
            fields,
        }
    } = req;

    if (request_id === 'a32f') {
        organization = fields.organization_selector;

        return sendSuccessfulResponse(res, fields_b);
    }

    const {
        customer_email,
        customer_name,
        date_of_birth,
        origin_country
    } = fields;

    const response = {
        action: 'process',
        fields: [
            {
                title: 'Customer Name',
                value: customer_name
            },
            {
                title: 'Customer Email',
                value: customer_email
            },
            {
                title: 'Customer Date of Birth',
                value: date_of_birth
            },
            {
                title: 'Customer Country of Origin',
                value: origin_country === 'SA' ? 'South Africa' : 'Nigeria'
            },
            {
                title: 'Customer Organization',
                value: organization === 'ENG' ? 'Engineering' : 'Product'
            },
        ],
        amount: 200,
        meta: {
            identifier: chance.guid(),
        }
    };

    return sendSuccessfulResponse(res, response);
};

module.exports = {
    getFields,
    processFields,
};

import httpStatus from 'http-status';
import { Logger } from 'conexa-core-server';
// eslint-disable-next-line import/no-cycle
import { formatOrderDataReceipt } from '../services/formatting.service';
import ApiError from './ApiError';
import { generatePDFString, mergePdfBuffers } from '../services/pdf.service';

type OrderDataReceipt = ReturnType<typeof formatOrderDataReceipt>;

const HTML_STYLES = `
        <style>
            .form_receipt_preview {
                background-color: rgb(182, 182, 182);
                border-radius: 6px;
                padding: 1rem;
                max-height: 400px;
                overflow-y: auto;
            }
            .receipt_list {
                margin: 0 auto;
                padding: 0.5rem 1rem;
                list-style: none;
                background-color: white;
                border-radius: 6px;
                font-size: 14px;
            }
            .bold {
                font-weight: bold
            }
            .hr {
                margin: 0.5rem 0;
                padding: 0;
            }
            .align_right {
                text-align: right;
            }
    
            .example {
                color: gray;
                font-style: italic;
                font-size: 10px;
            }
            .receipt_item {
                display: flex;
                flex-direction: column;
                align-content: flex-start;
                justify-content: center;
            }
            .two_columns {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        </style>
`;

function formatHTML(orderData: OrderDataReceipt) {
	const hidden = 'hidden';
	const empty = '';

	const { orderNumber, purchaseDate, storeName, receiptSettings } = orderData;

	let [orderInfo, remitterIncluded, notesIncluded, idIncluded] = [hidden, hidden, hidden, hidden];

	if (receiptSettings) {
		const { isOrderInfoIncluded, isRemitterIncluded, isNotesIncluded, isClientIdIncluded } =
			receiptSettings.receiptConfig;

		if (isOrderInfoIncluded) orderInfo = empty;
		if (isRemitterIncluded) remitterIncluded = empty;
		if (isNotesIncluded) notesIncluded = empty;
		if (isClientIdIncluded) idIncluded = empty;
	}

	let items: string = empty;
	let prices: string = empty;

	orderData.items.products.forEach((item) => {
		items += `<span class="example"> ${item.name}</span>`;
		prices += `<span class="example"> $${item.price}</span>`;
	});

	return `
    <!DOCTYPE html>
        <html lang="en">
            <head>${HTML_STYLES}</head>
            <body>
                <div class="receipt_list">
                    <div class="receipt_item">
                        <div class="two_columns">
                            <div class="receipt_item">
                                <span class="bold">Orden: #${orderNumber}</span>
                                <span>Realizada el ${purchaseDate}</span>
                            </div>
                            <span class="align_right bold">${storeName}</span>
                        </div>
                    </div>
                    <hr>
                    <div ${orderInfo}>
                        <div class="receipt_item">
                            <div class="two_columns">
                                <div class="receipt_item">
                                    <span>Productos</span>
                                    ${items}
                                </div>
                                <div class="receipt_item align_right">
                                    <span>Total</span>
                                    ${prices}
                                </div>
                            </div>
                            <hr />
                            
                            <div class="two_columns">
                                <div class="receipt_item">
                                    <span>Subtotal:</span>
                                    <span>Costo de envío:</span>
                                    <span>Impuestos:</span>
                                    <span>Descuentos:</span>
                                    <span class="bold">Total:</span>
                                </div>
                                <div class="receipt_item align_right">
                                    <span>$${orderData?.items?.amounts.subtotal}</span>
                                    <span>$${orderData?.items?.amounts.shippingCost}</span>
                                    <span>$${orderData?.items?.amounts.tax}</span>
                                    <span>$${orderData?.items?.amounts.discounts}</span>
                                    <span class="bold">$${orderData?.items?.total}</span>
                                </div>
                            </div>
                            <hr />
                            <span>
                                Medio de pago: <span class="example"> ${orderData?.items?.paymentMethod}</span>
                            </span>
                            <span>
                                Medio de envío: <span class="example">${orderData?.shippingName}</span>
                            </span>
                        </div>
                    </div>
                    <hr />
                    
                    <div>
                        <div class="receipt_item">
                            <span>Destinatario:</span>
                            <span class="example bold"> Nombre y apellido: ${orderData?.recipient?.nameSurname} </span>
                            <span class="example bold">Dirección: ${orderData?.recipient?.street} - ${orderData?.recipient?.city} (${orderData?.recipient?.province})</span>
                            <span class="example">Código postal: ${orderData?.recipient?.postalCode}</span>
                            <span class="example" ${idIncluded}>DNI/CUIL: ${orderData?.recipient?.dni}</span>
                        </div>
                    </div>
        
                    <hr />
                    <div ${remitterIncluded}>
                        <div class="receipt_item">
                            <span>Remitente:</span>
                            <span class="example bold"> Nombre y apellido: ${orderData?.remitter?.nameSurname} </span>
                            <span class="example">Código postal: ${orderData?.remitter?.postalCode}</span>
                            <span class="example">Provincia: ${orderData?.remitter?.province}</span>
                            <span class="example">País: ${orderData?.remitter?.country}</span>
                        </div>
                    </div>
                    <hr />
                    
                    <div ${notesIncluded}>
                        <div class="receipt_item">
                            <span> Notas: </span>
                            <span class="example">${orderData?.notes}</span>
                            <hr />
                        </div>
                    </div>
                </div>
            </body>
    </html>`;
}

const generateReceipt = async (order: OrderDataReceipt): Promise<string> => {
	const file = formatHTML(order);
	return generatePDFString(file);
};

async function mergeReceiptAndTicketData(ocaTickets: any, receiptBufferData: Buffer[]) {
	try {
		const transformTicketsInBuffer = Buffer.from(ocaTickets, 'base64');
		const buffers = [transformTicketsInBuffer, ...receiptBufferData];
		return await mergePdfBuffers(buffers);
	} catch (error) {
		Logger.error(error);
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`Error trying to merge pdf receipt and ticket pdf: ${error} `
		);
	}
}

export default { generateReceipt, mergeReceiptAndTicketData };

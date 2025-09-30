import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface OrderConfirmedEmailProps {
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  estimatedDelivery?: string;
  appUrl: string;
}

export default function OrderConfirmedEmail({
  orderNumber,
  customerName,
  totalAmount,
  estimatedDelivery,
  appUrl,
}: OrderConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Order Confirmed!</Text>

          <Section style={section}>
            <Text style={text}>
              Great news! Your order has been confirmed and is being prepared for shipment.
            </Text>

            <Section style={orderDetails}>
              <Text style={label}>Order Number:</Text>
              <Text style={value}>#{orderNumber}</Text>

              <Text style={label}>Customer:</Text>
              <Text style={value}>{customerName}</Text>

              <Text style={label}>Total Amount:</Text>
              <Text style={value}>${totalAmount}</Text>

              {estimatedDelivery && (
                <>
                  <Text style={label}>Estimated Delivery:</Text>
                  <Text style={value}>{estimatedDelivery}</Text>
                </>
              )}
            </Section>

            <Button href={`${appUrl}/orders/${orderNumber}`} style={button}>
              Track Your Order
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              You will receive another email when your order ships with tracking information.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  padding: '0 48px',
};

const section = {
  padding: '0 48px',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
};

const orderDetails = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '8px 0 4px 0',
};

const value = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0 0 12px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '24px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '12px',
};
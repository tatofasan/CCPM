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

interface OrderStatusChangeEmailProps {
  orderNumber: string;
  customerName: string;
  oldStatus: string;
  newStatus: string;
  statusMessage: string;
  trackingNumber?: string;
  appUrl: string;
}

export default function OrderStatusChangeEmail({
  orderNumber,
  customerName,
  oldStatus,
  newStatus,
  statusMessage,
  trackingNumber,
  appUrl,
}: OrderStatusChangeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} status updated to {newStatus}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Order Status Update</Text>

          <Section style={section}>
            <Text style={text}>
              Hello {customerName}, your order status has been updated.
            </Text>

            <Section style={orderDetails}>
              <Text style={label}>Order Number:</Text>
              <Text style={value}>#{orderNumber}</Text>

              <Text style={label}>Status:</Text>
              <Text style={value}>
                {oldStatus} → <strong>{newStatus}</strong>
              </Text>

              <Text style={statusText}>{statusMessage}</Text>

              {trackingNumber && (
                <>
                  <Text style={label}>Tracking Number:</Text>
                  <Text style={value}>{trackingNumber}</Text>
                </>
              )}
            </Section>

            <Button href={`${appUrl}/orders/${orderNumber}`} style={button}>
              View Order Details
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              Questions? Contact our support team anytime.
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

const statusText = {
  fontSize: '16px',
  color: '#3b82f6',
  fontWeight: '500',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#eff6ff',
  borderRadius: '6px',
};

const button = {
  backgroundColor: '#3b82f6',
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
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancelaMail {
  get key() {
    return 'CancelaMail';
  }

  async handle({ data }) {
    const { appointment } = data;

    console.log('teste envio de email');

    await Mail.senddMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancelado',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        data: format(
          parseISO(appointment.data),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancelaMail();

import Code from 'app/components/code';
import ServiceInfo__Section from 'app/components/service-info/__section';

const ServiceInfo = () => (
  <div className={b('service-info')}>
    <ServiceInfo__Section
      mods={{ for: 'hot-keys' }}
      title="Горячие клавиши"
      definitions={[
        {
          term: 'N',
          details: 'Переключает светлую тему на тёмную и обратно',
        },
        {
          term: 'S',
          details: 'Скрывает и раскрывает сайдбар',
        },
        {
          term: '/',
          details: 'Переводит фокус в поле поиска',
        },
      ]}
    />
    <ServiceInfo__Section
      title="Модификаторы поиска"
      subtitle="Модификатор указывается в строке поиска перед поисковым запросом"
      definitions={[
        {
          term: 'method:*',
          details: 'Оставляет в результатах поиска только экшены с указанным методом',
          note: (
            <>
              где * — HTTP-метод (GET, POST, PUT, DELETE и т.д.).
              <br/>
              Пример:
              {' '}
              <Code mods={{ theme: 'standard' }}>method:get</Code>
              {' '}
              или
              {' '}
              <Code mods={{ theme: 'standard' }}>method:post</Code>
            </>
          ),
        },
        {
          term: 'type:group',
          details: 'Ищет только группы',
        },
        {
          term: 'type:resource',
          details: 'Ищет только ресурсы',
        },
        {
          term: 'type:action',
          details: 'Ищет только экшены',
        },
      ]}
    />
  </div>
);

export default ServiceInfo;

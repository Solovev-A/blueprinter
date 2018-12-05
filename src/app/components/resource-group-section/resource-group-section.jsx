import RawContent from 'app/components/raw-content';
import Anchor from 'app/components/anchor';
import { get, htmlFromText, withHeaderAnchors } from 'app/common/utils/helpers';
import { hashFromTitle } from 'app/common/utils/helpers/hash';

export const DEFAULT_TITLE = 'Resource Group';

class ResourceGroupSection extends React.PureComponent {
  render() {
    const { route } = this.context.router;
    const { group, children } = this.props;

    // TODO: Здесь используется get().from(), чтобы избежать ошибки, если meta === undefined.
    // Но в некоторых частях кода проекта, используется прямое обращение. Как стоит
    // разрешить это?
    const title = get('meta', 'title').from(group) || DEFAULT_TITLE;
    const hash = hashFromTitle(title);
    const description = group.content[0].element === 'copy' ? group.content[0].content : null;

    const childrenWithParentHash = children.map(child => React.cloneElement(child, {
      parentHash: hash,
    }));

    return (
      <section className={b('resource-group-section', this.props)} id={hash}>
        <h2 className="resource-group-section__heading">
          {title}
          <Anchor
            mix="resource-group-section__anchor"
            hash={hash}
            pathname={route.location.pathname}
          />
        </h2>
        <div className="resource-group-section__body">
          {!!description && (
            <RawContent mix="resource-group-section__description">
              {withHeaderAnchors(htmlFromText(description))}
            </RawContent>
          )}

          <div className="resource-group-section__content">
            {childrenWithParentHash}
          </div>
        </div>
      </section>
    );
  }
}

ResourceGroupSection.defaultProps = {
  group: {},
};

ResourceGroupSection.propTypes = {
  group: PropTypes.shape({
    element: PropTypes.string,
    meta: PropTypes.object,
    content: PropTypes.array,
  }),
  children: PropTypes.node,
};

ResourceGroupSection.contextTypes = {
  router: PropTypes.object,
};

export default ResourceGroupSection;

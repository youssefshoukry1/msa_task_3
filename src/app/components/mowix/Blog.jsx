// Generated from the Mowix WordPress home page (Elementor page 971, container 78696582) by mowix-export/convert-html.mjs.
// The post loop is reworked into FAQ cards: same images and tags, question + short answer instead of excerpt and CTA.
import Image from "next/image";
import HomeIcon from "./HomeIcon";

const FAQS = [
  {
    tag: "Wohnfinanzierung",
    question: "Wie viel Immobilie kann ich mir leisten?",
    answer:
      "Als Faustregel sollte die monatliche Rate höchstens 35–40 % Ihres Nettoeinkommens betragen. Ideal sind rund 20 % Eigenkapital, zusätzlich sollten Sie etwa 10–15 % des Kaufpreises für Nebenkosten wie Grunderwerbsteuer, Notar und Makler einplanen.",
    image: {
      src: "/mowix/images/related_content_imgs/couple calculating home buying budget.webp",
      width: 3317,
      height: 2517,
      alt: "Paar berechnet das Budget für den Immobilienkauf",
    },
  },
  {
    tag: "Kreditvergleich",
    question: "Fix oder variabel finanzieren?",
    answer:
      "Eine feste Zinsbindung macht Ihre Rate über viele Jahre planbar und schützt vor steigenden Zinsen. Variable Darlehen sind flexibler, tragen aber ein Zinsrisiko. Für die meisten Käufer ist eine Zinsbindung von 10 bis 15 Jahren sinnvoll.",
    image: {
      src: "/mowix/images/related_content_imgs/pexels-rdne-8292895.webp",
      width: 4500,
      height: 3000,
      alt: "Berater erläutert unterschiedliche Hypothekenzinsen",
    },
  },
  {
    tag: "Umschuldung",
    question: "Wann lohnt sich eine Umschuldung?",
    answer:
      "Meist dann, wenn Ihre Zinsbindung ausläuft oder die aktuellen Zinsen deutlich unter Ihrem Vertragszins liegen. Nach zehn Jahren können Sie mit sechs Monaten Frist ohne Vorfälligkeitsentschädigung kündigen. Wir stellen Gebühren und Ersparnis transparent gegenüber.",
    image: {
      src: "/mowix/images/related_content_imgs/mortgage refinancing consultation.webp",
      width: 4500,
      height: 3000,
      alt: "Beratungsgespräch über die Umschuldung eines Immobilienkredits",
    },
  },
];

export default function Blog() {
  return (
    <div id="ratgeber" className="elementor-element elementor-element-78696582 e-flex e-con-boxed e-con e-parent" data-id="78696582">
      <div className="e-con-inner">
        <div className="elementor-element elementor-element-6036c416 e-con-full e-flex e-con e-child" data-id="6036c416">
          <div className="elementor-element elementor-element-4e13b10f e-con-full e-flex elementor-invisible e-con e-child" data-id="4e13b10f" data-settings='{"animation":"fadeInRight"}'>
            <div className="elementor-element elementor-element-54203d46 elementor-widget__width-inherit elementor-align-center elementor-mobile-align-center elementor-icon-list--layout-traditional elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list" data-id="54203d46" data-widget_type="icon-list.default">
              <ul className="elementor-icon-list-items">
                <li className="elementor-icon-list-item">
                  <a href="#ratgeber">
                    <span className="elementor-icon-list-icon">
                      <HomeIcon name="blog" />
                    </span>
                    {" "}
                    <span className="elementor-icon-list-text">Häufige Fragen</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="elementor-element elementor-element-13efb485 elementor-widget__width-initial elementor-widget elementor-widget-heading" data-id="13efb485" data-widget_type="heading.default">
              <h2 className="elementor-heading-title elementor-size-default">Gut informiert zur richtigen Entscheidung.</h2>
            </div>
          </div>
          <div className="elementor-element elementor-element-2c804e2b e-con-full e-flex e-con e-child" data-id="2c804e2b">
            <div className="elementor-element elementor-element-131ff58a elementor-grid-3 elementor-grid-tablet-2 elementor-grid-mobile-1 elementor-widget elementor-widget-loop-grid" data-id="131ff58a" data-widget_type="loop-grid.post">
              <div className="elementor-widget-container">
                <div className="elementor-loop-container elementor-grid" role="list">
                  {FAQS.map((faq) => (
                    <div key={faq.question} data-elementor-type="loop-item" data-elementor-id="1065" className="elementor elementor-1065 e-loop-item" role="listitem">
                      <div className="elementor-element elementor-element-060e89c e-flex e-con-boxed e-con e-parent" data-id="060e89c">
                        <div className="e-con-inner">
                          <div className="elementor-element elementor-element-a341deb elementor-widget elementor-widget-theme-post-featured-image elementor-widget-image" data-id="a341deb" data-widget_type="theme-post-featured-image.default">
                            <Image width={faq.image.width} height={faq.image.height} src={faq.image.src} className="attachment-large size-large" alt={faq.image.alt} sizes="(max-width: 767px) 85vw, (max-width: 1024px) 44vw, 29vw" quality={90} />
                          </div>
                          <div className="elementor-element elementor-element-50bff99 e-con-full e-flex e-con e-child" data-id="50bff99">
                            <div className="elementor-element elementor-element-4ceefca e-con-full e-flex e-con e-child" data-id="4ceefca">
                              <div className="elementor-element elementor-element-7e77ed1 elementor-widget elementor-widget-post-info" data-id="7e77ed1" data-widget_type="post-info.default">
                                <ul className="elementor-inline-items elementor-icon-list-items elementor-post-info">
                                  <li className="elementor-icon-list-item elementor-repeater-item-693c173 elementor-inline-item">
                                    <span className="elementor-icon-list-icon">
                                      <HomeIcon name="tag" />
                                    </span>
                                    {" "}
                                    <span className="elementor-icon-list-text elementor-post-info__item elementor-post-info__item--type-terms">
                                      <span className="elementor-post-info__terms-list">{faq.tag}</span>
                                    </span>
                                  </li>
                                </ul>
                              </div>
                              <details className="faq-item">
                                <summary className="faq-question elementor-element-0885f79">
                                  <h4 className="elementor-heading-title elementor-size-default">{faq.question}</h4>
                                  <span className="faq-toggle" aria-hidden="true">
                                    <HomeIcon name="chevronRight" />
                                  </span>
                                </summary>
                                <p className="faq-answer">{faq.answer}</p>
                              </details>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

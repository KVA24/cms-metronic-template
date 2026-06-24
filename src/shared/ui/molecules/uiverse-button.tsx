import styled from 'styled-components';

const UiverseButton = () => {
  return (
    <StyledWrapper>
      <button className="button" data-text="Awesome">
        <span className="actual-text">&nbsp;Text&nbsp;</span>
        <span aria-hidden="true" className="hover-text">
          &nbsp;Text&nbsp;
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  /* === removing default button style ===*/

  .button {
    margin: 0;
    height: auto;
    background: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
  }

  /* button styling */

  .button {
    letter-spacing: 3px;
    text-decoration: none;
    font-size: 2em;
    position: relative;
    text-transform: uppercase;
    color: transparent;
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.6);
  }

  /* this is the text, when you hover on button */

  .hover-text {
    position: absolute;
    box-sizing: border-box;
    content: attr(data-text);
    color: #37ff8b;
    width: 0%;
    inset: 0;
    border-right: 6px solid #37ff8b;
    overflow: hidden;
    transition: 0.5s;
    -webkit-text-stroke: 1px #37ff8b;
  }

  /* hover */

  .button:hover .hover-text {
    width: 100%;
    filter: drop-shadow(0 0 23px #37ff8b);
  }
`;

export default UiverseButton;

# Dockerfile extending the generic Node image with application files for a
# single application.
FROM gcr.io/google_appengine/nodejs
# Check to see if the the version included in the base runtime satisfies
# '~0.12', if not then do an npm install of the latest available
# version that satisfies it.
RUN /usr/local/bin/install_node '~0.12'

# install phantom
RUN apt-get -q update
RUN apt-get -y install build-essential chrpath git-core libssl-dev libfontconfig1-dev libxft-dev git wget    
ENV PHANTOM_JS phantomjs-2.1.1-linux-x86_64
RUN wget https://github.com/paladox/phantomjs/releases/download/2.1.7/$PHANTOM_JS.tar.bz2
RUN tar xvjf $PHANTOM_JS.tar.bz2
RUN mv $PHANTOM_JS /usr/local/share
RUN rm $PHANTOM_JS.tar.bz2
RUN ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin

# continue with app install
COPY . /app/
# You have to specify "--unsafe-perm" with npm install
# when running as root.  Failing to do this can cause
# install to appear to succeed even if a preinstall
# script fails, and may have other adverse consequences
# as well.
# This command will also cat the npm-debug.log file after the
# build, if it exists.
RUN npm install --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)
CMD npm start



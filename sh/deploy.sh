#!/bin/bash

runmap_now=`date +%Y-%m-%d--%H-%M-%S`

mkdir /var/www/runmap.run/archive/$runmap_now
mv /var/www/runmap.run/public/* /var/www/runmap.run/archive/$runmap_now
cp /var/lib/jenkins/workspace/RunMap/public/* /var/www/runmap.run/public
chgrp buildusers /var/www/runmap.run/public
unset runmap_now
